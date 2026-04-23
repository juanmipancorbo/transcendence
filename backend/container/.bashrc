# Force colored output for standard programs (like npm)
export CLICOLOR=1
export TERM=xterm-256color

# Define colors
GREEN='\[\e[32m\]'
BLUE='\[\e[34m\]'
RESET='\[\e[0m\]'

# Set the Prompt (Username and Host in Green, Path in Blue)
PS1="${GREEN}\u@\h${RESET}:${BLUE}\w${RESET}\$ "