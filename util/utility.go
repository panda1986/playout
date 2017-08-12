package util

import "os"

func Exist(filename string) bool {
    _, err := os.Stat(filename)
    return err == nil || os.IsExist(err)
}

func Contain(array []string, item string) bool {
    for _, a := range array {
        if a == item {
            return true
        }
    }
    return false
}

func Size(filename string) (int64) {
    if f, err := os.Stat(filename); err != nil {
        return 0
    } else {
        return f.Size()
    }
}
