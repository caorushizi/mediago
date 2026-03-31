// Package parser 控制台输出解析
package parser

import (
	"regexp"
	"strconv"
	"strings"

	"caorushizi.cn/mediago/internal/core/schema"
)

// ParseState 解析状态
type ParseState struct {
	Ready   bool    // 是否已进入 ready 状态
	Percent float64 // 当前进度百分比
	Speed   string  // 当前下载速度
	IsLive  bool    // 是否为直播
}

// LineParser 控制台输出解析器
type LineParser struct {
	percentReg *regexp.Regexp
	speedReg   *regexp.Regexp
	errorReg   *regexp.Regexp
	startReg   *regexp.Regexp
	isLiveReg  *regexp.Regexp
}

// 处理退格符，返回真实显示的字符串
func processBackspaces(s string) string {
	result := []rune{}

	for _, ch := range s {
		if ch == '\b' {
			// 遇到退格符，删除最后一个字符
			if len(result) > 0 {
				result = result[:len(result)-1]
			}
		} else {
			// 普通字符，添加到结果
			result = append(result, ch)
		}
	}

	return string(result)
}

// NewLineParser 创建解析器
func NewLineParser(cr schema.ConsoleReg) (*LineParser, error) {
	lp := &LineParser{}
	var err error

	if cr.Percent != "" {
		lp.percentReg, err = regexp.Compile(cr.Percent)
		if err != nil {
			return nil, err
		}
	}
	if cr.Speed != "" {
		lp.speedReg, err = regexp.Compile(cr.Speed)
		if err != nil {
			return nil, err
		}
	}
	if cr.Error != "" {
		lp.errorReg, err = regexp.Compile(cr.Error)
		if err != nil {
			return nil, err
		}
	}
	if cr.Start != "" {
		lp.startReg, err = regexp.Compile(cr.Start)
		if err != nil {
			return nil, err
		}
	}
	if cr.IsLive != "" {
		lp.isLiveReg, err = regexp.Compile(cr.IsLive)
		if err != nil {
			return nil, err
		}
	}

	return lp, nil
}

// Parse 解析一行控制台输出，返回事件类型和错误信息
func (lp *LineParser) Parse(line string, state *ParseState) (event string, errMsg string) {
	// 错误行
	if lp.errorReg != nil && lp.errorReg.MatchString(line) {
		return "", line
	}

	// 是否直播
	if lp.isLiveReg != nil && lp.isLiveReg.MatchString(line) {
		state.IsLive = true
	}

	// 检测开始标识，进入 ready 状态
	if !state.Ready && lp.startReg != nil && lp.startReg.MatchString(line) {
		return "ready", ""
	}

	// 解析进度百分比（记录是否匹配到）
	matchedPercent := false
	if lp.percentReg != nil {
		line = processBackspaces(line)
		matches := lp.percentReg.FindStringSubmatch(line)
		if len(matches) > 1 {
			if percent, err := strconv.ParseFloat(matches[1], 64); err == nil {
				state.Percent = percent
				matchedPercent = true
			}
		}
	}

	// 解析下载速度（记录是否匹配到）
	matchedSpeed := false
	if lp.speedReg != nil {
		matches := lp.speedReg.FindStringSubmatch(line)
		if len(matches) > 1 {
			state.Speed = strings.TrimSpace(matches[1])
			matchedSpeed = true
		}
	}

	// 若未 ready，但已解析到进度或速度，自动进入 ready（即便配置了 start 但未命中）
	if !state.Ready && (matchedPercent || matchedSpeed) {
		state.Ready = true
		return "ready", ""
	}

	return "", ""
}
