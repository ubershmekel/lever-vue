var orgName = 'lever';

function ajaxGet(url, callback) {
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4 && xmlhttp.status == 200) {
            try {
                var data = JSON.parse(xmlhttp.responseText);
                callback(null, data);
            } catch(err) {
                console.log(err.message + " in " + xmlhttp.responseText);
                callback(err, null);
            }

        }
    };

    xmlhttp.open("GET", url, true);
    xmlhttp.send();
}

function groupBy(arr, func) {
    var groups = [];
    var sortedArr = arr.sort(function(a, b) {
        return func(a).localeCompare(func(b));
    });
    var lastGroup = null; 
    for (var i = 0; i < sortedArr.length; i++) {
        var item = sortedArr[i];
        if (!lastGroup || func(item) !== lastGroup.name) {
            lastGroup = {
                name: func(item),
                items: [],
            }
            groups.push(lastGroup);
        }
        lastGroup.items.push(item);
    }
    return groups;
}

function main() {
    var app = new Vue({
        el: '#jobs-list',
        data: {
            isLoading: true,
            // Example for json data at https://api.lever.co/v0/postings/lever?mode=json
            jobs: [],
            setFilters: {},
        },
        computed: {
            teamJobs() {
                return groupBy(this.jobs, function(job) {
                    return job.categories.team
                });
            },
            filtersList() {
                var filterNameToOptions = {};
                for (var i = 0; i < this.jobs.length; i++) {
                    var job = this.jobs[i];
                    for (var category in job.categories) {
                        //console.log('category', category);
                        if (!filterNameToOptions[category]) {
                            // Using an object to dedupe
                            filterNameToOptions[category] = {};
                        }
                        var categoryValue = job.categories[category];
                        filterNameToOptions[category][categoryValue] = true;
                    }
                }
                var filters = [];
                for (var name in filterNameToOptions) {
                    var optionsList = [];
                    for (var option in filterNameToOptions[name]) {
                        optionsList.push(option);
                    }
                    if (optionsList.length <= 1) {
                        // Single options don't need to be togglable because
                        // the whole list would go away.
                        continue;
                    }
                    filters.push({
                        name: name,
                        options: optionsList,
                    });
                }
                return filters;
            },
            filteredJobs() {
                // Get set filters, return filtered jobs
                var filtered = [];
                var anyFilters = {};
                for (var filter in this.setFilters) {
                    var isSet = this.setFilters[filter];
                    if (!isSet) {
                        continue;
                    }
                    var parts = filter.split('<__>');
                    var category = parts[0];
                    var value = parts[1];
                    anyFilters[category] = true;
                }
                for (var i = 0; i < this.jobs.length; i++) {
                    var job = this.jobs[i];
                    var isShown = true;
                    for (var catName in job.categories) {
                        if (!anyFilters[catName]) {
                            // no filters set on this category, don't filter it.
                            continue;
                        }
                        var value = job.categories[catName];
                        var filterCode = catName + '<__>' + value;
                        if (!this.setFilters[filterCode]) {
                            isShown = false;
                            break;
                        }
                    }
                    if (isShown) {
                        filtered.push(job);
                    }
                }
                return groupBy(filtered, function(job) {
                    return job.categories.team;
                });
            },
        }
    });

    ajaxGet('https://api.lever.co/v0/postings/' + orgName + '?mode=json', function(err, data) {
        app.isLoading = false;
        if(err) {
            console.error('failed ajax', err);
            return;
        }
        //console.log('data', data);
        //shuffleArray(data);
        app.jobs = data;
        //app.setTeamJobs(data);
        window.globalJobs = data;
    });
}

function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = array[i];
        array[i] = array[j];
        array[j] = temp;
    }
}

main();
