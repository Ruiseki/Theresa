#ifndef TOOL_HPP_INCLUDED
#define TOOL_HPP_INCLUDED

#include <string>
#include <vector>

struct Cli_parameter
{
    std::string key;
    std::string value;
};

std::vector<std::string> split(std::string str, char c);
std::string join(const char **argv, int argc, char c);
int get_pchar_size(const char *p);
int get_parameters(const char **argv, int argc, Cli_parameter **parametersv, int *parametersc);
bool str_start_with(const char *input, const char *pattern, bool case_sensible);

#endif // TOOL_HPP_INCLUDED
