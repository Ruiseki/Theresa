BUILD_DIR = build
CORES = $(shell nproc)

all: init
	@cmake --build $(BUILD_DIR) -j$(CORES)

init: $(BUILD_DIR)
	@cmake -S . -B $(BUILD_DIR) -DCMAKE_EXPORT_COMPILE_COMMANDS=1
	@ln -sf $(BUILD_DIR)/compile_commands.json .

clean:
	@cmake --build build/ --target clean

clean_all:
	@rm -rf $(BUILD_DIR)
	@rm compile_commands.json

$(BUILD_DIR):
	@mkdir $(BUILD_DIR)
