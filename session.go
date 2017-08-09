package main

import (
    "chnvideo.com/cloud/common/core"
    "fmt"
    "net/http"
)

type MemorySession struct {
                           // TODO: timeAccessed time.Time //最后访问时间
    ip           string    //用户ip
    user *UserInfo
}

type SessionManager struct {
    ums *Ums
    sessions map[string]*MemorySession // key is the session_id, returned by ums
}

func NewSessionManager(ums *Ums) *SessionManager {
    v := &SessionManager{
        ums: ums,
        sessions: make(map[string]*MemorySession),
    }
    return v
}

func (v *SessionManager) Sid(r *http.Request) (sid string, err error)  {
    cookie, err := r.Cookie(CookieName)
    if err != nil || cookie.Value == "" {
        return "", fmt.Errorf("didn't have %v in cookie", CookieName)
    }

    return cookie.Value, nil
}

func (v *SessionManager) SessionRead(r *http.Request) (sess *MemorySession, err error) {
    var sid string
    if sid, err = v.Sid(r); err != nil {
        core.LoggerError.Println("get sessionid failed, err is", err)
        return
    }

    //  check if session_id in memory,
    //      if in, return
    //      if not in, save in memory
    var ok bool
    if sess, ok = v.sessions[sid]; ok {
        return
    }

    // get user api
    var user *UserInfo
    if user, err = v.ums.UserInfo(sid); err != nil {
        core.LoggerError.Println(fmt.Sprintf("read sid:%v user info failed, err is %v", sid, err))
        return
    }
    core.LoggerTrace.Println("read sid:%v user info=%v", sid, user)

    sess = &MemorySession{
        ip: r.RemoteAddr,
        user: user,
    }
    v.sessions[sid] = sess
    return
}

func (v *SessionManager) UserInfo(r *http.Request) (user *UserInfo, err error) {
    var sid string
    if sid, err = v.Sid(r); err != nil {
        core.LoggerError.Println("get sessionid failed, err is", err)
        return
    }

    if sess, ok := v.sessions[sid]; !ok {
        err = fmt.Errorf("can't find sess of %v in memory", sid)
        core.LoggerError.Println(err.Error())
        return
    } else {
        user = sess.user
        return
    }
}
