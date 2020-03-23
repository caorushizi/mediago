package scheduler

import (
	"sync"
)

type Scheduler struct {
	sync.WaitGroup

	Chs     chan int  // 默认下载量
	Ans     chan bool // 每个进程的下载状态
	Success int
}

// 创建新的调度器
func New(count int) (scheduler Scheduler, err error) {
	return Scheduler{
		Chs: make(chan int, count),
		Ans: make(chan bool),
	}, nil
}

func (s *Scheduler) Work(executeFn func() error) {
	defer func() {
		<-s.Chs // 某个任务下载完成，让出
		s.Done()
	}()

	//需要根据下载内容作存储等处理
	if err := executeFn(); err != nil {
		// fixme: 处理下载时出现错误
		panic(err)
	}

	s.Ans <- true // 告知下载完成
}
