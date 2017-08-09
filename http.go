package main

import (
    "chnvideo.com/cloud/common/core"
    "encoding/json"
    "fmt"
    "net/http"
    "os"
)

// header["Content-Type"] in response.
const (
    HttpJson       = "application/json"
    HttpJavaScript = "application/javascript"
)

// system conplex error.
type SystemComplexError struct {
    // the system error code.
    Code int `json:"code"`
    // the description for this error.
    Message string `json:"data"`
}

// Wrapper for complex error use Error(ctx, SystemComplexError{})
// @remark user can use WriteCplxError() for simple api.
func Error(code int, message string) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        core.LoggerError.Println(fmt.Sprintf("Serve %v failed. code=%d, err =%v", r.URL, code, message))
        jsonHandler(&SystemComplexError{Code: code, Message: message}).ServeHTTP(w, r)
    })
}

// http normal response.
// @remark user can use nil v to response success, which data is null.
// @remark user can use WriteData() for simple api.
func Data(v interface{}) http.Handler {
    rv := map[string]interface{}{
        "code":   0,
        "server": os.Getpid(),
        "data":   v,
    }

    // for string, directly use it without convert,
    // for the type covert by golang maybe modify the content.
    if v, ok := v.(string); ok {
        rv["data"] = v
    }

    return jsonHandler(rv)
}

// response json directly.
func jsonHandler(rv interface{}) http.Handler {
    var err error
    var b []byte
    if b, err = json.Marshal(rv); err != nil {
        core.LoggerError.Println(fmt.Sprintf("json handler encode %+v failed, err is %v", rv, err))
    }

    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        q := r.URL.Query()
        if cb := q.Get("callback"); cb != "" {
            w.Header().Set("Content-Type", HttpJavaScript)
            fmt.Fprintf(w, "%s(%s)", cb, string(b))
        } else {
            w.Header().Set("Content-Type", HttpJson)
            w.Write(b)
        }
    })
}

// Directly write json data, a wrapper for Data().
// @remark user can use Data() for group of complex apis.
func WriteData(w http.ResponseWriter, r *http.Request, v interface{}) {
    Data(v).ServeHTTP(w, r)
}

// Directly write complex error, a wrappter for CplxError().
// @remark user can use CplxError() for group of complex apis.
func WriteError(w http.ResponseWriter, r *http.Request, code int, message string) {
    Error(code, message).ServeHTTP(w, r)
}
