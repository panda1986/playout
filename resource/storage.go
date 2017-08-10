package resource

import (
    "chnvideo.com/cloud/playout/util"
    "path"
    "os"
    "log"
    "sync"
)

type Storage struct {
    uploadDir string
    chunkDir string
    files map[int]*UploadFile
}

func NewStorage() (v *Storage, err error) {
    v = &Storage{
        uploadDir: path.Join("upload"),
        files: make(map[int]*UploadFile),
    }
    v.chunkDir = path.Join(v.uploadDir, "chunks")

    if !util.Exist(v.uploadDir) {
        if err = os.MkdirAll(v.uploadDir, 0777); err != nil {
            log.Println("can't create upload dir, err is", err)
            return
        }
    }
    if !util.Exist(v.chunkDir) {
        if err = os.MkdirAll(v.chunkDir, 0777); err != nil {
            if err = os.MkdirAll(v.chunkDir, 0777); err != nil {
                log.Println("can't create chunk dir, err is", err)
                return
            }
        }
    }
    return
}

func (v *Storage) createFile(id, totalSize int, name string, totalChunks int) {

}

type UploadFile struct {
    size int
    name string
    id int
    chunks map[int]*UploadChunk
}

func NewUploadFile() *UploadFile {
    v := &UploadFile{
        chunks: make(map[int]*UploadChunk),
    }
    return v
}

type UploadChunk struct {
    id int
    file *UploadFile
    completed bool
    lock *sync.Mutex
}

