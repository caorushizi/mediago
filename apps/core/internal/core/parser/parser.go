// Package parser parses console output
package parser

import (
	"regexp"
	"strconv"
	"strings"

	"caorushizi.cn/mediago/internal/core/schema"
)

// ParseState holds the current parse state
type ParseState struct {
	Ready   bool    // whether the ready state has been entered
	Percent float64 // current progress percentage
	Speed   string  // current download speed
	IsLive  bool    // whether this is a live stream
}

// LineParser is a console output parser
type LineParser struct {
	percentReg *regexp.Regexp
	speedReg   *regexp.Regexp
	errorReg   *regexp.Regexp
	startReg   *regexp.Regexp
	isLiveReg  *regexp.Regexp
}

// processBackspaces processes backspace characters and returns the visually displayed string
func processBackspaces(s string) string {
	result := []rune{}

	for _, ch := range s {
		if ch == '\b' {
			// Backspace character: remove the last character
			if len(result) > 0 {
				result = result[:len(result)-1]
			}
		} else {
			// Regular character: append to result
			result = append(result, ch)
		}
	}

	return string(result)
}

// NewLineParser creates a parser
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

// Parse parses a line of console output and returns the event type and error message
func (lp *LineParser) Parse(line string, state *ParseState) (event string, errMsg string) {
	// Error line
	if lp.errorReg != nil && lp.errorReg.MatchString(line) {
		return "", line
	}

	// Check if it is a live stream
	if lp.isLiveReg != nil && lp.isLiveReg.MatchString(line) {
		state.IsLive = true
	}

	// Detect start marker and enter the ready state
	if !state.Ready && lp.startReg != nil && lp.startReg.MatchString(line) {
		return "ready", ""
	}

	// Parse progress percentage (track whether a match was found)
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

	// Parse download speed (track whether a match was found)
	matchedSpeed := false
	if lp.speedReg != nil {
		matches := lp.speedReg.FindStringSubmatch(line)
		if len(matches) > 1 {
			state.Speed = strings.TrimSpace(matches[1])
			matchedSpeed = true
		}
	}

	// If not yet ready but progress or speed was parsed, automatically enter ready (even if start was configured but not matched)
	if !state.Ready && (matchedPercent || matchedSpeed) {
		state.Ready = true
		return "ready", ""
	}

	return "", ""
}
