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
std::string join(const std::string argv[], const unsigned int argc, const char c);
int get_parameters(std::string argv[], unsigned int argc, Cli_parameter **parametersv, int *parametersc);
bool str_start_with(const char *input, const char *pattern, bool case_sensible);

#endif // TOOL_HPP_INCLUDED
