package db

import "time"

// Video 映射到 "video" 表（历史命名，实际代表下载任务）。
// 列名必须与 TypeORM 创建的表结构完全一致（camelCase）。
type Video struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name        string    `gorm:"column:name;type:text;not null;uniqueIndex" json:"name"`
	Type        string    `gorm:"column:type;type:text;not null;default:'m3u8'" json:"type"`
	URL         string    `gorm:"column:url;type:text;not null" json:"url"`
	Folder      *string   `gorm:"column:folder;type:text" json:"folder"`
	Headers     *string   `gorm:"column:headers;type:text" json:"headers"`
	IsLive      bool      `gorm:"column:isLive;not null;default:0" json:"isLive"`
	Status      string    `gorm:"column:status;type:text;not null;default:'ready'" json:"status"`
	CreatedDate time.Time `gorm:"column:createdDate;autoCreateTime" json:"createdDate"`
	UpdatedDate time.Time `gorm:"column:updatedDate;autoUpdateTime" json:"updatedDate"`
}

func (Video) TableName() string { return "video" }

// Favorite 映射到 "favorite" 表。
type Favorite struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Title       string    `gorm:"column:title;type:text;not null" json:"title"`
	URL         string    `gorm:"column:url;type:text;not null" json:"url"`
	Icon        *string   `gorm:"column:icon;type:text" json:"icon"`
	CreatedDate time.Time `gorm:"column:createdDate;autoCreateTime" json:"createdDate"`
	UpdatedDate time.Time `gorm:"column:updatedDate;autoUpdateTime" json:"updatedDate"`
}

func (Favorite) TableName() string { return "favorite" }

// Conversion 映射到 "conversion" 表。
type Conversion struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name        *string   `gorm:"column:name;type:text" json:"name"`
	Path        string    `gorm:"column:path;type:text;not null;default:''" json:"path"`
	CreatedDate time.Time `gorm:"column:createdDate;autoCreateTime" json:"createdDate"`
	UpdatedDate time.Time `gorm:"column:updatedDate;autoUpdateTime" json:"updatedDate"`
}

func (Conversion) TableName() string { return "conversion" }
