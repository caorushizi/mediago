package db

import "time"

// Video maps to the "video" table (legacy naming; actually represents download tasks).
// Column names must exactly match the table schema created by TypeORM (camelCase).
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

// Favorite maps to the "favorite" table.
type Favorite struct {
	ID          int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Title       string    `gorm:"column:title;type:text;not null" json:"title"`
	URL         string    `gorm:"column:url;type:text;not null" json:"url"`
	Icon        *string   `gorm:"column:icon;type:text" json:"icon"`
	CreatedDate time.Time `gorm:"column:createdDate;autoCreateTime" json:"createdDate"`
	UpdatedDate time.Time `gorm:"column:updatedDate;autoUpdateTime" json:"updatedDate"`
}

func (Favorite) TableName() string { return "favorite" }

// Conversion maps to the "conversion" table.
type Conversion struct {
	ID           int64     `gorm:"column:id;primaryKey;autoIncrement" json:"id"`
	Name         *string   `gorm:"column:name;type:text" json:"name"`
	Path         string    `gorm:"column:path;type:text;not null;default:''" json:"path"`
	Status       string    `gorm:"column:status;type:text;not null;default:'pending'" json:"status"`
	OutputPath   string    `gorm:"column:outputPath;type:text;default:''" json:"outputPath"`
	OutputFormat string    `gorm:"column:outputFormat;type:text;default:''" json:"outputFormat"`
	Quality      string    `gorm:"column:quality;type:text;default:'medium'" json:"quality"`
	Progress     int       `gorm:"column:progress;not null;default:0" json:"progress"`
	Error        *string   `gorm:"column:error;type:text" json:"error"`
	CreatedDate  time.Time `gorm:"column:createdDate;autoCreateTime" json:"createdDate"`
	UpdatedDate  time.Time `gorm:"column:updatedDate;autoUpdateTime" json:"updatedDate"`
}

func (Conversion) TableName() string { return "conversion" }
