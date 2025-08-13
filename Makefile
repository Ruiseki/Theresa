# Compiler
CXX ?= g++
CFLAGS += -g
CFLAGS += -Wall
CFLAGS += -Wextra
CFLAGS += -fdiagnostics-color=always

BUILD_DIR = build
DEPS_DIR = deps
BIN_DIR := $(BUILD_DIR)/bin

SRC_DIR = src
SRC_DISCORD_DIR = $(SRC_DIR)/discord
SOURCE_FILES := $(wildcard $(SRC_DIR)/*.cpp)
SOURCE_DISCORD_FILES := $(wildcard $(SRC_DISCORD_DIR)/*.cpp)

OBJ_DIR := $(BUILD_DIR)/obj
OBJ_FILES := $(patsubst $(SRC_DIR)/%.cpp,$(OBJ_DIR)/%.o,$(SOURCE_FILES))
OBJ_FILES += $(patsubst $(SRC_DISCORD_DIR)/%.cpp,$(OBJ_DIR)/%.o,$(SOURCE_DISCORD_FILES))

INCLUDE_PATH = -Iinclude
INCLUDE_PATH += -Ideps

all: $(BUILD_DIR) bin

bin: $(BIN_DIR)/theresa

clean:
	@rm -rf $(BUILD_DIR)

$(BIN_DIR)/theresa: $(OBJ_FILES) | $(BIN_DIR)
	@echo "[building main programm] theresa"
	@$(CXX) -o $@ $(OBJ_FILES) -lssl -lcrypto

$(OBJ_DIR)/%.o: $(SRC_DIR)/%.cpp | $(OBJ_DIR)
	@echo "[compiling core file] $<"
	@$(CXX) -o $@ -c $(CFLAGS) $(INCLUDE_PATH) $<

$(OBJ_DIR)/%.o: $(SRC_DISCORD_DIR)/%.cpp | $(OBJ_DIR)
	@echo "[compiling extension : discord] $<"
	@$(CXX) -o $@ -c $(CFLAGS) $(INCLUDE_PATH) $<

$(BIN_DIR):
	@mkdir $(BIN_DIR)

$(OBJ_DIR):
	@mkdir $(OBJ_DIR)

$(BUILD_DIR):
	@mkdir $(BUILD_DIR)
