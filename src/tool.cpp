#include <cstring>

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

std::string join(const char **argv, int argc, char c)
{
    std::string joined = "";
    for(int i = 0; i < argc; i++)
    {
        joined += argv[i];
        joined += c;
    }
    
    joined.erase(joined.end() - 1);
    return joined;
}

int get_pchar_size(const char *p)
{
    int size = 0;
    while(*p != '\0')
    {
        size++;
        p++;
    };
    return size;
}

/**
 * @return first parameter index
 */
int get_parameters(const char **argv, int argc, Cli_parameter **parametersv, int *parametersc)
{
    int result = argc;
    *parametersc = 0;
    for(int i = 0; i < argc; i++)
        if(argv[i][0] == '-')
        {
            if(i < result) result = i;
            (*parametersc)++;
        }
    
    *parametersv = new Cli_parameter[*parametersc];
    int parser = 0;
    std::vector<std::string> splited;
    for(int i = 0; i < argc; i++)
        if(argv[i][0] == '-')
        {
            std::string key(argv[i] + 1, get_pchar_size(argv[i]) - 1);

            if(i + 1 != argc)
            {
                if(argv[i + 1][0] != '-')
                    (*parametersv)[parser] = {key, argv[i + 1]};
                else
                    (*parametersv)[parser] = {key, ""};
            }
            else
                (*parametersv)[parser] = {key, ""};
            parser++;
        }
    return result;
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
