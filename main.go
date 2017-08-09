package main

import (
    "chnvideo.com/cloud/common/core"
    "net/http"
    "os"
    "fmt"
    "net/url"
    "io/ioutil"
    "strings"
)

type UMS struct {
    addr string
}

func (v *UMS) get_menu_list() (res []byte, err error) {
    api := fmt.Sprintf("http://%s%s", v.addr, UMS_GET_MENU_LIST_API)
    form := make(url.Values)
    form.Set("m_type", "0")
    form.Set("user_id", "1")
    form.Set("system", PRODUCT_SYSTEM)

    var resp *http.Response
    var req *http.Request

    if req, err = http.NewRequest("POST", api, strings.NewReader(form.Encode())); err != nil {
        core.LoggerError.Println("http post", api, "failed. err is", err)
        return
    }
    req.Header.Set("Accept", "*/*")
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    req.AddCookie(&http.Cookie{Name: "sessionid", Value: "'VkPJQMgmOwcTTivhT8ShEw=='"})

    core.LoggerTrace.Println("post to", api, req.Cookies())

    client := &http.Client{}
    if resp, err = client.Do(req); err != nil {
        core.LoggerError.Println("do request failed, err is", err)
        return
    }

    defer resp.Body.Close()

    if res, err = ioutil.ReadAll(resp.Body); err != nil {
        core.LoggerError.Println("read body from", api, "failed. err is", err)
        return
    }

    return
}

func main()  {
    listen := ":2047"
    ums_host_port := "127.0.0.1:8082"
    fmt.Println(fmt.Sprintf("http listen at:%v, ums:%v", listen, ums_host_port))

    ums := &UMS{addr: ums_host_port}

    http.HandleFunc("/account/get_menu_list", func(w http.ResponseWriter, r *http.Request) {
        res, _ := ums.get_menu_list()
        w.Write(res)
    })

    if err := http.ListenAndServe(listen, nil); err != nil {
        fmt.Println(nil, "playout listen at ", listen, "failed. err is", err)
        os.Exit(-1)
    }
}