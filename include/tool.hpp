#ifndef TOOL_HPP_INCLUDED
#define TOOL_HPP_INCLUDED

#include <string>
#include <vector>

struct Cli_parameter
{
    int pos_in_query = -1;
    std::string key = "";
    std::string value = "";

    bool operator==(const Cli_parameter &p)
    {
        return pos_in_query == p.pos_in_query && key == p.key && value == p.value;
    }

    bool operator!=(const Cli_parameter &p)
    {
        return pos_in_query != p.pos_in_query || key != p.key || value != p.value;
    }
};

std::vector<std::string> split(std::string str, char c);
std::string join(const std::string argv[], const unsigned int argc, const char c);
std::vector<Cli_parameter> get_parameters(std::string argv[], unsigned int argc);
bool str_start_with(const char *input, const char *pattern, bool case_sensible);

#endif // TOOL_HPP_INCLUDED
