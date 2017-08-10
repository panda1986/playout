package main

import (
    "chnvideo.com/cloud/common/core"
    "fmt"
    "net/http"
)

type MemorySession struct {
    sid string
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

func (v *SessionManager) sid(r *http.Request) (sid string, err error)  {
    q := r.URL.Query()
    token := q.Get("token")
    if len(token) == 0 {
        cookie, err := r.Cookie(CookieName)
        if err != nil || cookie.Value == "" {
            return "", fmt.Errorf("didn't have %v in cookie", CookieName)
        }
        return cookie.Value, nil
    }
    token = fmt.Sprintf("'%s'", token)
    fmt.Println("got token", token, string(token))
    return token, nil
}

func (v *SessionManager) Session(r *http.Request) (s *MemorySession, err error) {
    var sid string
    if sid, err = v.sid(r); err != nil {
        core.LoggerError.Println("get sessionid failed, err is", err)
        return
    }

    var ok bool
    if s, ok = v.sessions[sid]; ok {
        return
    }

    err = fmt.Errorf("can't find session of :%v", sid)
    core.LoggerError.Println(err.Error())
    return
}

func (v *SessionManager) SessionRead(w http.ResponseWriter, r *http.Request) (sess *MemorySession, err error) {
    var sid string
    if sid, err = v.sid(r); err != nil {
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
        sid: sid,
        ip: r.RemoteAddr,
        user: user,
    }
    v.sessions[sid] = sess

    cookie := http.Cookie{Name: CookieName, Value: sid, Path: "/", HttpOnly: true}
    http.SetCookie(w, &cookie)
    return
}

func (v *SessionManager) UserInfo(r *http.Request) (user *UserInfo, err error) {
    var sid string
    if sid, err = v.sid(r); err != nil {
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
