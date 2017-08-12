package main

import (
    "chnvideo.com/cloud/common/core"
    "net/http"
    "os"
    "fmt"
    "flag"
    "log"
    "runtime"
    "chnvideo.com/cloud/playout/util"
    "chnvideo.com/cloud/playout/resource"
    "strconv"
    "encoding/binary"
)

func main()  {
    cfg := flag.String("c", "playout.conf", "configuration file")
    version := flag.Bool("v", false, "show version")
    flag.Parse()
    if *version {
        fmt.Println(Version)
        os.Exit(0)
    }
    if err := ParseConfig(*cfg); err != nil {
        log.Fatalf("parse config failed, err is %v", err)
    }

    ums := &Ums{}
    gSess := NewSessionManager(ums)
    storage, err := resource.NewStorage(Config().Resources.VideoDir)
    if err != nil {
        core.LoggerError.Println(fmt.Sprintf("new storage failed, err is %v", err))
        return
    }

    sql = NewSqlServer()
    if err := sql.Open(); err != nil {
        core.LoggerError.Println(fmt.Sprintf("open mysql failed, err is:%v", err))
        return
    }
    defer sql.Close()

    runtime.GOMAXPROCS(Config().NbCpus)
    fmt.Println(fmt.Sprintf("http listen at:%v, ums:%v, cpu:%v", Config().Listen, Config().Playout.Ums, Config().NbCpus))

    // hjack http request, check if has session_id in cookie,
    //  if not return 401
    // The injector hijack each http request.
    injector := func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if _, err := gSess.SessionRead(w, r); err != nil {
                http.Error(w, err.Error(), http.StatusUnauthorized)
                return
            }

            next.ServeHTTP(w, r)
        })
    }

    ui := http.FileServer(http.Dir("static-dir"))
    http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {

        q := r.URL.Query()
        token := q.Get("token")
        if len(token) != 0 {
            if _, err := gSess.SessionRead(w, r); err != nil {
                http.Error(w, err.Error(), http.StatusUnauthorized)
                return
            }
        }
        ui.ServeHTTP(w, r)
    })

    http.Handle("/resource/upload", injector(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        q := r.URL.Query()
        chunkId, _ := strconv.Atoi(q.Get("resumableChunkNumber"))
        fid := q.Get("resumableIdentifier")
        name := q.Get("resumableFilename")
        totalChunks, _ := strconv.Atoi(q.Get("resumableTotalChunks"))
        curChunkSize, _ := strconv.ParseInt(q.Get("resumableCurrentChunkSize"), 10, 64)

        if r.Method == "POST" {
            rfile := storage.Query(fid)
            if rfile == nil {
                rfile = storage.CreateFile(fid, name, totalChunks)
            }

            body := make([]byte, curChunkSize)
            if err  := binary.Read(r.Body, binary.BigEndian, body); err != nil {
                Error(ErrorReadRequestBody, err.Error()).ServeHTTP(w, r)
                return
            }

            rfile.Write(chunkId, body)
            Data(&struct {
                Status string `json:"status"`
                Result interface{} `json:"result"`
            }{"success", nil}).ServeHTTP(w, r)
            return
        }

        if r.Method == "GET" {
            rfile := storage.Query(fid)
            if rfile == nil {
                http.Error(w, "", http.StatusUnauthorized)
                return
            }
            rchunk := rfile.Chunk(chunkId)
            if rchunk == nil {
                http.Error(w, "", http.StatusUnauthorized)
                return
            }
            if rchunk.IsComplete(curChunkSize) {
                Data(&struct {
                    Status string `json:"status"`
                    Result interface{} `json:"result"`
                }{"completed", nil}).ServeHTTP(w, r)
                return
            }
            http.Error(w, "", http.StatusUnauthorized)
            return
        }
    })))

    http.Handle("/account/get_user_info", injector(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        info, err := gSess.UserInfo(r)
        if err != nil {
            Error(ErrorGetUserInfo, err.Error()).ServeHTTP(w, r)
            return
        }

        Data(info).ServeHTTP(w, r)
        return
    })))

    http.Handle("/account/get_menu_list", injector(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        s, _ := gSess.Session(r)
        q := r.URL.Query()
        m_type := q.Get("m_type")
        if !util.Contain(MenuTypes, m_type) {
            err := fmt.Errorf("invalid menu type:%v, not in %v", m_type, MenuTypes)
            Error(ErrorInvalidMenuType, err.Error()).ServeHTTP(w, r)
            return
        }

        ml, err := ums.MenuList(m_type, s.sid, s.user.Id)
        if err != nil {
            Error(ErrorGetMenuList, err.Error()).ServeHTTP(w, r)
            return
        }
        Data(ml).ServeHTTP(w, r)
        return

    })))

    listen := fmt.Sprintf("0.0.0.0:%v", Config().Listen)
    if err := http.ListenAndServe(listen, nil); err != nil {
        fmt.Println(nil, "playout listen at ", listen, "failed. err is", err)
        os.Exit(-1)
    }
}
