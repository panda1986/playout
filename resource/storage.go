package resource

import (
    "chnvideo.com/cloud/common/core"
    "chnvideo.com/cloud/playout/util"
    "path"
    "os"
    "log"
    "sync"
    "fmt"
    "io/ioutil"
)

type Storage struct {
    uploadDir string
    chunkDir string
    files map[string]*UploadFile // key is file id
    baseDir string
}

func NewStorage(base string) (v *Storage, err error) {
    v = &Storage{
        uploadDir: path.Join("upload"),
        files: make(map[string]*UploadFile),
        baseDir: base,
    }
    v.chunkDir = path.Join(v.uploadDir, "chunks")

    if !util.Exist(v.baseDir) {
        if err = os.MkdirAll(v.baseDir, 0777); err != nil {
            log.Println(fmt.Sprintf("can't create storage basedir:%v, err is %v", v.baseDir, err))
            return
        }
    }
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

func (v *Storage) CreateFile(fid string, name string, totalChunks int) (f *UploadFile) {
    f = NewUploadFile(fid, name, totalChunks, v.baseDir)
    v.files[fid] = f
    return
}

// query file obj by fileId
func (v *Storage) Query(fileId string) (f *UploadFile) {
    var ok bool
    if f, ok = v.files[fileId]; !ok {
        return nil
    }
    return
}

//chunk id is startwith 1, we use array to store chunks
type UploadFile struct {
    baseDir string
    size   int
    name   string
    fid    string
    chunks []*UploadChunk
}

func NewUploadFile(fid string, name string, totalChunks int, base string) *UploadFile {
    v := &UploadFile{
        baseDir: base,
        fid: fid,
        name: name,
        chunks: []*UploadChunk{},
    }

    for i := 1; i < totalChunks + 1; i++ {
        v.chunks = append(v.chunks, NewUploadChunk(v, i))
    }
    return v
}

func (v *UploadFile) Write(chunkId int, data []byte) {
    chunk := v.Chunk(chunkId)
    if chunk == nil {
        return
    }

    if !v.SaveChunk(chunk, data) {
        core.LoggerInfo.Println(fmt.Sprintf("havn;t save all chunks=%d, cur chunk id=%v", len(v.chunks), chunk.id))
        return
    }

    fPath := path.Join(v.baseDir, v.name)
    core.LoggerTrace.Println(fmt.Sprintf("save all chunks, start to write file %v", fPath))
    f, err := os.OpenFile(fPath, os.O_CREATE|os.O_RDWR|os.O_TRUNC, 0777)
    if err != nil {
        core.LoggerError.Println(fmt.Sprintf("create file:%v for upload failed, err is %v", fPath, err))
        return
    }
    defer f.Close()

    //TODO: chunks are not post by sequence, so we should sort chunks by chunkId
    for i, ck := range v.chunks {
        body, err := ck.ReadAll()
        if err != nil {
            core.LoggerError.Println("read chunk:%v body failed, err is %v", i, err)
            continue
        }
        f.Write(body)
        os.Remove(ck.fPath)
    }

    os.RemoveAll(path.Join("upload", "chunks", v.fid))
}

func (v *UploadFile) Chunk(cid int) (ck *UploadChunk) {
    if cid <= 0 { // chunk id must >= 1
        return nil
    }
    if cid > len(v.chunks) {
        return nil
    }
    return v.chunks[cid - 1]
}

func (v *UploadFile) SaveChunk(chunk *UploadChunk, body []byte) (completed bool) {
    chunk.Write(body)
    for _, ck := range v.chunks {
        if !ck.IsComplete(-1) {
            return false
        }
    }
    return true
}

type UploadChunk struct {
    id        int
    uf        *UploadFile
    completed bool
    lock      *sync.Mutex
    fPath     string
}

func NewUploadChunk(uf *UploadFile, id int) *UploadChunk {
    v := &UploadChunk{
        uf: uf,
        id: id,
        lock: &sync.Mutex{},
    }

    dir := path.Join("upload", "chunks", uf.fid)
    if !util.Exist(dir) {
        if err := os.MkdirAll(dir, 0777); err != nil {
            core.LoggerError.Println(fmt.Sprintf("mkdir for %v failed, err is %v", dir, err))
        }
    }
    _, name := path.Split(v.uf.name)
    v.fPath = path.Join(dir, fmt.Sprintf("chunk%s.part%d", name, v.id))
    return v
}

func (v *UploadChunk) Write(data []byte) {
    var err error
    var f *os.File
    if f, err = os.OpenFile(v.fPath, os.O_RDWR|os.O_CREATE, 0777);  err != nil {
        core.LoggerError.Println(fmt.Sprintf("create chunk file %v failed, err is %v", v.fPath, err))
    }
    defer f.Close()
    f.Write(data)
}

func (v *UploadChunk) ReadAll() (data []byte, err error) {
    f, _ := os.Open(v.fPath)
    defer f.Close()

    data, err = ioutil.ReadAll(f)
    return
}

func (v *UploadChunk) IsComplete(size int64) bool {
    if !util.Exist(v.fPath) {
        return false
    }

    if size == -1 {
        return true
    }
    chunkSize := util.Size(v.fPath)
    if chunkSize == size {
        return true
    }
    //if chunk size not equal to expected, remove it, and then will repost
    os.Remove(v.fPath)
    return false
}

