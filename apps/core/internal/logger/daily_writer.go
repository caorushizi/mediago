package logger

import (
    "fmt"
    "os"
    "path/filepath"
    "strings"
    "sync"
    "time"

    "gopkg.in/natefinch/lumberjack.v2"
)

// dailyRotateWriter 按天拆分日志文件的写入器。
// 文件名格式：<base>-YYYY-MM-DD<ext>，例如 mediago-2025-10-30.log
type dailyRotateWriter struct {
    mu          sync.Mutex
    cfg         Config
    base        string
    ext         string
    currentDate string
    lj          *lumberjack.Logger
}

func newDailyRotateWriter(cfg Config) *dailyRotateWriter {
    base, ext := splitName(cfg.LogFileName)
    d := &dailyRotateWriter{cfg: cfg, base: base, ext: ext}
    d.rotateIfNeededLocked(time.Now())
    return d
}

func (d *dailyRotateWriter) Write(p []byte) (int, error) {
    now := time.Now()
    d.mu.Lock()
    d.rotateIfNeededLocked(now)
    lj := d.lj
    d.mu.Unlock()
    return lj.Write(p)
}

func (d *dailyRotateWriter) Sync() error {
    // lumberjack 没有 Sync 的必要；尽量确保目录存在
    if err := os.MkdirAll(d.cfg.LogDir, 0755); err != nil {
        return err
    }
    return nil
}

func (d *dailyRotateWriter) Close() error {
    d.mu.Lock()
    defer d.mu.Unlock()
    if d.lj != nil {
        return d.lj.Close()
    }
    return nil
}

func (d *dailyRotateWriter) filenameFor(date string) string {
    name := fmt.Sprintf("%s-%s%s", d.base, date, d.ext)
    return filepath.Join(d.cfg.LogDir, name)
}

func (d *dailyRotateWriter) rotateIfNeededLocked(now time.Time) {
    cur := now.Format("2006-01-02")
    if d.lj != nil && d.currentDate == cur {
        return
    }
    // 切换到当天文件
    if d.lj != nil {
        _ = d.lj.Close()
    }
    d.currentDate = cur
    d.lj = &lumberjack.Logger{
        Filename:   d.filenameFor(cur),
        MaxSize:    d.cfg.MaxSize,
        MaxBackups: d.cfg.MaxBackups,
        MaxAge:     d.cfg.MaxAge,
        Compress:   d.cfg.Compress,
    }
    // 按需清理过期的历史日志文件
    d.cleanupOldLogsLocked(now)
}

func (d *dailyRotateWriter) cleanupOldLogsLocked(now time.Time) {
    if d.cfg.MaxAge <= 0 {
        return
    }
    // 删除超过 MaxAge 天的 <base>-YYYY-MM-DD<ext> 文件
    entries, err := os.ReadDir(d.cfg.LogDir)
    if err != nil {
        return
    }
    cutoff := now.AddDate(0, 0, -d.cfg.MaxAge)
    prefix := d.base + "-"
    suffix := d.ext

    for _, e := range entries {
        if e.IsDir() {
            continue
        }
        name := e.Name()
        if !strings.HasPrefix(name, prefix) || !strings.HasSuffix(name, suffix) {
            continue
        }
        // 解析日期
        datePart := strings.TrimSuffix(strings.TrimPrefix(name, prefix), suffix)
        t, err := time.Parse("2006-01-02", datePart)
        if err != nil {
            continue
        }
        if t.Before(cutoff) {
            _ = os.Remove(filepath.Join(d.cfg.LogDir, name))
        }
    }
}

func splitName(filename string) (base, ext string) {
    ext = filepath.Ext(filename)
    base = strings.TrimSuffix(filename, ext)
    return
}

