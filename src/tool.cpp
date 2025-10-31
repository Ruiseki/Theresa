#include <cstring>
#include <vector>

#include "tool.hpp"

std::vector<std::string> split(std::string str, char c)
{
    std::vector<std::string> split;
    std::string buffer = "";

    for(size_t i = 0; i < str.size(); i++)
    {
        if(str[i] == c && buffer != "")
        {
            split.push_back(buffer);
            buffer = "";
        }
        else buffer += str[i];
    }
    if(buffer != "") split.push_back(buffer);

    return split;
}

std::string join(const std::string argv[], const unsigned int argc, const char c)
{
    std::string joined = "";
    for(unsigned int i = 0; i < argc; i++)
    {
        joined += argv[i];
        joined += c;
    }

    joined.erase(joined.end() - 1);
    return joined;
}

/**
 * @return first parameter index
 */
std::vector<Cli_parameter> get_parameters(std::string argv[], unsigned int argc)
{
    std::vector<Cli_parameter> parameters;
    std::vector<std::string> splited;
    Cli_parameter current_parameter;

    for(unsigned int i = 0; i < argc; i++)
        if(argv[i][0] == '-')
        {
            if(current_parameter != Cli_parameter())
            {
                parameters.push_back(current_parameter);
                current_parameter = Cli_parameter();
            }

            current_parameter.pos_in_query = i;
            current_parameter.key.assign(argv[i].begin() + 1, argv[i].end());
            if(current_parameter.key == "-")
            {
                current_parameter.value = "-";
                parameters.push_back(current_parameter);
                return parameters;
            }
        }
        else if(current_parameter != Cli_parameter())
        {
            current_parameter.value += (current_parameter.value == "" ? "" : " ") + argv[i];
        }

    if(current_parameter != Cli_parameter())
        parameters.push_back(current_parameter);
    return parameters;
}

bool str_start_with(const char *input, const char *pattern, bool case_sensible)
{
    while(*pattern != '\0')
    {
        if(!case_sensible)
        {
            char alt_input = *input >= 65 && *input <= 90 ? *input + 32 : *input;
            char alt_pattern = *pattern >= 65 && *pattern <= 90 ? *pattern + 32 : *pattern;
            if(alt_input != alt_pattern) break;
        }
        else
            if(*input != *pattern) break;
        input++; pattern++;
        // Meh need to decrement input and pattern
    }

    if(*pattern == '\0') return true;
    else return false;
}
