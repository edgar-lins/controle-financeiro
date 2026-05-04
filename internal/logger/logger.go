package logger

import (
	"log/slog"
	"os"
)

// Init configura o logger padrão global. Deve ser chamado uma vez na inicialização.
// Em produção usa JSON (machine-readable); em dev usa texto (human-readable).
func Init(env string) {
	opts := &slog.HandlerOptions{Level: slog.LevelInfo}
	var handler slog.Handler
	if env == "production" {
		handler = slog.NewJSONHandler(os.Stdout, opts)
	} else {
		opts.Level = slog.LevelDebug
		handler = slog.NewTextHandler(os.Stdout, opts)
	}
	slog.SetDefault(slog.New(handler))
}
