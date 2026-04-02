package conf

// Options configures a Conf instance.
type Options[T any] struct {
	// ConfigName is the name of the config file (without extension).
	// Default: "config"
	ConfigName string

	// CWD is the directory where the config file is stored.
	// Default: current working directory.
	CWD string

	// FileExtension is the file extension for the config file.
	// Default: "json"
	FileExtension string

	// Defaults provides the initial configuration values.
	// These are used when the config file does not exist or when a key is missing.
	Defaults T
}

func (o *Options[T]) applyDefaults() {
	if o.ConfigName == "" {
		o.ConfigName = "config"
	}
	if o.FileExtension == "" {
		o.FileExtension = "json"
	}
}
