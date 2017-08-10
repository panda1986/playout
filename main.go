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
)

func main()  {
    cfg := flag.String("c", "log.conf", "configuration file")
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

    sql = NewSqlServer()
    if err := sql.Open(); err != nil {
        core.LoggerError.Println(fmt.Sprintf("open mysql failed, err is:%v", err))
        return
    }
    defer sql.Close()

    runtime.GOMAXPROCS(Config().NbCpus)
    fmt.Println(fmt.Sprintf("http listen at:%v, ums:%v, cpu:%v", Config().Listen, Config().Playout.Ums, Config().NbCpus))

    core.HttpMount("static-dir", "/", "/bpo.html", core.StdHttpHeaderServer(fmt.Sprintf("%s/%s", ProductSystem, Version), nil))

    // hjack http request, check if has session_id in cookie,
    //  if not return 401
    // The injector hijack each http request.
    injector := func(next http.Handler) http.Handler {
        return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
            if _, err := gSess.SessionRead(r); err != nil {
                http.Error(w, err.Error(), http.StatusUnauthorized)
                return
            }

            next.ServeHTTP(w, r)
        })
    }

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