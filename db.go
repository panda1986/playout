package main

import (
    "sync"
    "chnvideo.com/cloud/common/core"
    "chnvideo.com/cloud/common/mysql"
    "fmt"
)

var sql *SqlServer

type SqlServer struct {
    sql *mysql.SqlClient
    lock *sync.Mutex
}

func NewSqlServer() *SqlServer {
    s := &SqlServer{}
    s.sql = mysql.NewSqlClient(Config())
    s.lock = &sync.Mutex{}
    return s
}

func (s *SqlServer) Open() error {
    return s.sql.Open()
}

func (s *SqlServer) Close() {
    s.sql.Close()
}

func (s *SqlServer) ResourceVideoCreate() (id int64, err error) {
    s.lock.Lock()
    defer s.lock.Unlock()

    /*query := "insert into resource_video(metric, topic) values(?, ?)"
    _, id, err = s.sql.Exec(query, metric, topic)
    if err != nil {
        core.LoggerError.Println(fmt.Sprintf("create metric failed, err is %v", err))
        return
    }*/
    core.LoggerTrace.Println(fmt.Sprintf("create resource_video success, id=%v", id))
    return
}
