package resource

import (
    "testing"
    "os"
    "path"
    "io/ioutil"
)

func Equal(a []byte, b []byte) bool {
    if len(a) != len(b) {
        return false
    }
    for k, _ := range a {
        if a[k] != b[k] {
            return false
        }
    }
    return true
}

func TestUploadFile_Write(t *testing.T) {
    rfile := NewUploadFile("abcedf", "test.mp4", 2, "/tmp/")

    body := []byte{0,0,0,28}
    body2 := []byte{102,116,121,112}

    rfile.Write(2, body2)
    rfile.Write(1, body)

    fPath := path.Join(rfile.baseDir,rfile.name)
    if f, err := os.Open(fPath); err != nil {
        t.Fatalf("open upload file failed, err is %v", err)
    } else if res, err := ioutil.ReadAll(f); err != nil {
        t.Fatalf("read upload file failed, err is %v", err)
    } else if !Equal(res, append(body, body2...)) {
        t.Fatalf("check file body failed, not equal, exp=%v, actual=%v", append(body, body2...), res)
    }
}
