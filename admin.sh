#!/bin/bash

FILE="history.txt"

# colors for better CLI readability (ANSI escape codes)
# used with echo -e to render colored output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'   # reset color back to normal

USER_SELECTED=""

while true
do
    clear
    echo -e "${YELLOW}---- ADMIN PANEL (history.txt) ----${NC}"
    echo "1. Select user"
    echo "2. View recent games"
    echo "3. Analytics"
    echo "4. Delete entries"
    echo "5. Log rotation"
    echo "6. Sort and view"
    echo "7. Exit"
    echo ""

    read -p "Enter choice: " choice

    # -----------------------------
    # 1. SELECT USER
    # -----------------------------
    if [ "$choice" = "1" ]; then
        echo "Users available:"
        
        # cut: extract first column (username)
        # sort: arrange alphabetically
        # uniq: remove duplicates
        # => produces unique list of users
        cut -d',' -f1 "$FILE" | sort | uniq
        echo ""

        read -p "Enter username: " temp_user

        # awk logic:
        # -F',' → split fields using comma
        # tolower() → case-insensitive comparison
        # found=1 → flag if match found
        # END{exit !found} → exit 0 if found, 1 otherwise
        if awk -F',' -v u="$temp_user" 'tolower($1)==tolower(u){found=1} END{exit !found}' "$FILE"; then
            USER_SELECTED="$temp_user"
            echo -e "${GREEN}Now working with: $USER_SELECTED${NC}"
        else
            echo -e "${RED}User not found!${NC}"
            USER_SELECTED=""
        fi

        read -p "Press enter..."

    # -----------------------------
    # 2. VIEW RECENT GAMES
    # -----------------------------
    elif [ "$choice" = "2" ]; then
        if [ -z "$USER_SELECTED" ]; then
            echo -e "${RED}No user selected${NC}"
        else
            echo "Showing last games for $USER_SELECTED"
            echo ""

            # awk filters rows matching selected user
            # tail limits output to last 20 records
            awk -F',' -v u="$USER_SELECTED" 'tolower($1)==tolower(u)' "$FILE" | tail -n 20 |
            while IFS=',' read u sc cause dur ts
            do
                # normalize cause to lowercase for consistent comparison
                cause_lc=$(echo "$cause" | tr 'A-Z' 'a-z')

                # color coding based on cause
                if [ "$cause_lc" = "wall" ]; then
                    cause_col="${BLUE}$cause${NC}"
                elif [ "$cause_lc" = "self" ]; then
                    cause_col="${RED}$cause${NC}"
                else
                    cause_col="${GREEN}$cause${NC}"
                fi

                # formatted output
                echo -e "$u | $sc | $cause_col | $dur | $ts"
            done | less -R   # -R preserves colors in pager
        fi
        read -p "Press enter..."

    # -----------------------------
    # 3. ANALYTICS
    # -----------------------------
    elif [ "$choice" = "3" ]; then
        read -p "Enter timestamp limit (DD-MM-YYYY HH:MM:SS or press enter): " TS

        echo ""
        echo "------ Analytics ------"

        awk -F',' -v limit="$TS" '
        BEGIN {
            # initialize accumulators
            s=0; d=0; c=0
            w=0; se=0; en=0

            # convert input timestamp to sortable numeric form
            # format: YYYYMMDDHHMMSS (string comparison works correctly)
            if(limit != "") {
                lim = substr(limit,7,4) substr(limit,4,2) substr(limit,1,2) \
                      substr(limit,12,2) substr(limit,15,2) substr(limit,18,2)
            }
        }

        # NF==5 ensures valid rows (exact number of fields)
        NF==5 {
            # convert each record timestamp similarly
            cur = substr($5,7,4) substr($5,4,2) substr($5,1,2) \
                  substr($5,12,2) substr($5,15,2) substr($5,18,2)

            # apply timestamp filter
            if(limit == "" || cur <= lim) {
                s += $2      # accumulate scores
                d += $4      # accumulate durations
                c++          # count entries

                cause = tolower($3)

                # classify causes
                if(cause=="wall") w++
                else if(cause=="self") se++
                else if(cause=="enemy") en++
            }
        }

        END {
            # handle case when no valid data found
            if(c==0){
                print "No data found"
                exit
            }

            # compute averages and fractions
            print "Total games:", c
            print "Mean score:", s/c
            print "Mean duration:", d/c

            print "Fraction wall deaths:", w/c
            print "Fraction self deaths:", se/c
            print "Fraction enemy deaths:", en/c
        }' "$FILE"

        read -p "Press enter..."

    # -----------------------------
    # 4. DELETE ENTRIES
    # -----------------------------
    elif [ "$choice" = "4" ]; then
        echo "Delete options:"
        echo "1. By username"
        echo "2. By timestamp"
        echo "3. Remove bad lines"
        read -p "Choice: " ch

        if [ "$ch" = "1" ]; then
            read -p "Enter username: " u
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                # keep only rows where username does NOT match
                awk -F',' -v user="$u" 'tolower($1)!=tolower(user)' "$FILE" > tmp && mv -f tmp "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "2" ]; then
            read -p "Enter timestamp: " t
            read -p "Are you sure? (y/n): " c
            if [ "$c" = "y" ]; then
                # remove rows matching exact timestamp
                awk -F',' -v x="$t" '$5!=x' "$FILE" > tmp && mv -f tmp "$FILE"
                echo "Done"
            fi

        elif [ "$ch" = "3" ]; then
            # filter only valid rows with 5 fields
            awk -F',' 'NF==5' "$FILE" > tmp && mv -f tmp "$FILE"
            echo "Cleaned invalid lines"
        fi

        read -p "Press enter..."

    # -----------------------------
    # 5. LOG ROTATION
    # -----------------------------
    elif [ "$choice" = "5" ]; then
        # unique backup filename using epoch timestamp
        BACKUP="backup_$(date +%s).tar.gz"

        # create compressed backup
        tar -czf "$BACKUP" "$FILE" 2>/dev/null

        # $? checks exit status of previous command
        if [ $? -ne 0 ]; then
            echo "Permission denied! Run in writable directory or use sudo."
            read -p "Press enter..."
            continue
        fi

        # mktemp creates safe temporary file
        TMP=$(mktemp)

        # keep only last 10 entries
        tail -n 10 "$FILE" > "$TMP"
        mv -f "$TMP" "$FILE"

        echo "Backup created: $BACKUP"
        echo "File trimmed to last 10 entries"

        read -p "Press enter..."

    # -----------------------------
    # 6. SORTING
    # -----------------------------
    elif [ "$choice" = "6" ]; then
        echo "Sort by:"
        echo "1. Timestamp"
        echo "2. Username"
        echo "3. Score"
        read -p "Choice: " ch

        if [ "$ch" = "2" ]; then
            sort -t',' -k1 "$FILE" | less

        elif [ "$ch" = "3" ]; then
            sort -t',' -k2 -n "$FILE" | less

        elif [ "$ch" = "1" ]; then
            # convert timestamp to sortable numeric form before sorting
            awk -F',' 'NF==5 {
                ts = substr($5,7,4) substr($5,4,2) substr($5,1,2) \
                     substr($5,12,2) substr($5,15,2) substr($5,18,2)
                print ts "," $0
            }' "$FILE" | sort -t',' -k1 | cut -d',' -f2- | less

        else
            echo "Invalid option"
            read -p "Press enter..."
        fi

    # -----------------------------
    # 7. EXIT
    # -----------------------------
    elif [ "$choice" = "7" ]; then
        exit 0

    else
        echo "Invalid choice"
        read -p "Press enter..."
    fi
done