package main

import (
    "chnvideo.com/cloud/common/core"
    "fmt"
    "net/url"
    "net/http"
    "strings"
    "io/ioutil"
    "encoding/json"
    "strconv"
)

type UserInfo struct {
    Id int `json:"id"`
    UserName string `json:"username"`
    Email string `json:"email"`
    CellPhone string `json:"cellphone"`
}

type MenuSubContent struct {
    Status int `json:"status"` //1-启用，0-禁用
    NeedVerify int `json:"need_verify"` //是否需要审核 0-不需要，1-需要（针对 轮播频道分类）
    Id int `json:"id"`
    Name string `json:"name"`
    Level int `json:"level"`
    Url string `json:"url"`
    Selected bool `json:"selected"`
    ParentId int `json:"parent_id"`
    Desc string `json:"desc"`
    Order int `json:"order"`
    WorkFlowId int `json:"wf_id"` //工作流ID
}

type MenuContent struct {
    MenuSubContent
    ChileMenu []*MenuSubContent `json:"child_menu"`
}

type Menu struct {
    MenuContent
    ChildMenu []*MenuContent `json:"child_menu"`
}

type Ums struct {
}

func (v *Ums) postForm(sid, url string, form url.Values) (body []byte, err error) {
    var resp *http.Response
    var req *http.Request

    if req, err = http.NewRequest("POST", url, strings.NewReader(form.Encode())); err != nil {
        core.LoggerError.Println("http post", url, "failed. err is", err)
        return
    }
    req.Header.Set("Accept", "*/*")
    req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
    req.AddCookie(&http.Cookie{Name: "sessionid", Value: sid})

    core.LoggerTrace.Println("ums post to", url, "values", form.Encode())

    client := &http.Client{}
    if resp, err = client.Do(req); err != nil {
        core.LoggerError.Println("do request failed, err is", err)
        return
    }

    defer resp.Body.Close()

    if body, err = ioutil.ReadAll(resp.Body); err != nil {
        core.LoggerError.Println("read body from", url, "failed. err is", err)
        return
    }

    status := &struct {
        Status string `json:"status"`
    }{}
    if err = json.Unmarshal(body, status); err != nil {
        core.LoggerError.Println(fmt.Sprintf("parse ums status failed, body:%v, err is %v", string(body), err))
        return
    }

    if status.Status != "success" {
        err = fmt.Errorf("response=%v", string(body))
        core.LoggerError.Println(err.Error())
        return
    }

    return
}

func (v *Ums) MenuList(m_type, sid string, uid int) (menu []*Menu, err error) {
    api := fmt.Sprintf("http://%s%s", Config().Playout.Ums, UmsGetMenuListApi)
    form := make(url.Values)
    form.Set("m_type", m_type)
    form.Set("user_id", strconv.Itoa(uid))
    form.Set("system", ProductSystem)

    var body []byte
    if body, err = v.postForm(sid, api, form); err != nil {
        return
    }

    result := &struct {
        Result []*Menu `json:"result"`
    }{}
    if err = json.Unmarshal(body, result); err != nil {
        core.LoggerError.Println(fmt.Sprintf("parse ums result failed, body:%v, err is %v", string(body), err))
        return
    }

    menu = result.Result
    return
}

func (v *Ums) UserInfo(sid string) (user *UserInfo, err error) {
    api := fmt.Sprintf("http://%s%s", Config().Playout.Ums, UmsGetUserApi)
    form := make(url.Values)
    form.Set("token", fmt.Sprintf("sessionid=%s", sid))
    form.Set("fr", "ajax")

    var body []byte
    if body, err = v.postForm(sid, api, form); err != nil {
        return
    }

    result := &struct {
        Result *UserInfo `json:"result"`
    }{}
    if err = json.Unmarshal(body, result); err != nil {
        core.LoggerError.Println(fmt.Sprintf("parse ums result failed, body:%v, err is %v", string(body), err))
        return
    }

    user = result.Result
    return
}
