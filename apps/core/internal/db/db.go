package db

import (
	"github.com/glebarez/sqlite"
	"gorm.io/gorm"
	"gorm.io/gorm/logger"
)

// Database 封装 GORM 数据库连接。
type Database struct {
	DB *gorm.DB
}

// New 打开 SQLite 数据库连接并自动建表。
func New(dbPath string) (*Database, error) {
	db, err := gorm.Open(sqlite.Open(dbPath), &gorm.Config{
		Logger: logger.Default.LogMode(logger.Silent),
	})
	if err != nil {
		return nil, err
	}

	// AutoMigrate: create tables if they don't exist
	if err := db.AutoMigrate(&Video{}, &Favorite{}, &Conversion{}); err != nil {
		return nil, err
	}

	// Migrate legacy "watting" status to "pending"
	db.Exec(`UPDATE video SET status = 'pending' WHERE status = 'watting'`)

	return &Database{DB: db}, nil
}

// Close 关闭数据库连接。
func (d *Database) Close() error {
	sqlDB, err := d.DB.DB()
	if err != nil {
		return err
	}
	return sqlDB.Close()
}
