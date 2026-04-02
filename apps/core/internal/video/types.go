package video

// Video represents a playable video derived from a completed download task
type Video struct {
	ID    int64  `json:"id"`
	Title string `json:"title"`
	URL   string `json:"url"` // streaming path: /videos/filename.ext
}
