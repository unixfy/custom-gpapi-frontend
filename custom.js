// Edit this if SB discount changes. Needs to be in decimal format
let gambitDiscountPercent = 0.10;

// Pull data on page load
window.onload = function() {
    // Reload the data from API
    reloadData();
}

// Function to generate Bet Amounts, Profit per Card column - returns data to a function to update table
function betMethodSwitcher(data, i) {
    // Logic to generate the bet amounts and stuff based on the recommended play
    if ($("#betMethodSelector" + i + " option:selected").text() == "HighRisk") {
        var BetAmounts = `
                    Bet <b>${data[i].Calc.HighRisk.BetAmount}</b> tokens on ${data[i].Calc.HighRisk.TeamToBetOn}
                    `
        var ProfitPerCard = data[i].Calc.HighRisk.ProfitPerCard + '% ≈ ' + ((parseFloat(data[i].Calc.HighRisk.ProfitPerCard)/100) * (parseFloat(1000 * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB';
        var ProfitPerCardRaw = data[i].Calc.HighRisk.ProfitPerCard;
    } else if ($("#betMethodSelector" + i + " option:selected").text() == "MedRisk" ) {
        var BetAmounts = `
                    Bet <b>${data[i].Calc.MedRisk.Team1BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team1ToBetOn}
                    and
                    <b>${data[i].Calc.MedRisk.Team2BetAmount}</b> tokens on ${data[i].Calc.MedRisk.Team2ToBetOn}
                    `
        var ProfitPerCard = data[i].Calc.MedRisk.ProfitPerCard + '% ≈ ' + ((parseFloat(data[i].Calc.MedRisk.ProfitPerCard)/100) * (parseFloat(1000 * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB';
        var ProfitPerCardRaw = data[i].Calc.MedRisk.ProfitPerCard;
    } else if ($("#betMethodSelector" + i + " option:selected").text() == "NoRisk") {
        // Need more logic to display different strings depending if there is a draw condition
        if (data[i].Calc.NoRisk.DrawBetAmount) {
            var BetAmounts = `
                        Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name},
                        <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name},
                        and <b>${data[i].Calc.NoRisk.DrawBetAmount}</b> tokens on Draw
                        `
        } else {
            var BetAmounts = `    
                        Bet <b>${data[i].Calc.NoRisk.Team1BetAmount}</b> tokens on ${data[i].Team1.Name}
                        and <b>${data[i].Calc.NoRisk.Team2BetAmount}</b> tokens on ${data[i].Team2.Name}
                        `
        }
        var ProfitPerCard = data[i].Calc.NoRisk.ProfitPerCard + '% ≈ ' + ((parseFloat(data[i].Calc.NoRisk.ProfitPerCard)/100) * (parseFloat(1000 * (1 - gambitDiscountPercent)))).toFixed(2) + ' SB';
        var ProfitPerCardRaw = data[i].Calc.NoRisk.ProfitPerCard;
    } else {
        var BetAmounts = "err";
        var ProfitPerCard = "err";
        var ProfitPerCardRaw = null;
    }

    // Returns data in an array
    return {
        "BetAmounts": BetAmounts,
        "ProfitPerCard": ProfitPerCard,
        "ProfitPerCardRaw": ProfitPerCardRaw
    };
}

// Function to grab data from API
function reloadData() {
    // Show preloader
    showLoader();
    // Remove datatables, will be reinitialized later
    destroyDataTables();
    // Fetch data from API
    fetch('https://hfj9ocdja8.execute-api.eu-west-1.amazonaws.com/gambit-plays/tokens/1000/?_limit=100&_sort=createdAt:DESC')
        .then(function (response) {
            return response.json();
        })
        .then(function (data) {
            // Create HTML table
            appendData(data);
            console.log('Data successfully reloaded.');

            // Initialize DataTables
            initDataTables();

            // Hide the preloader
            clearLoader();
        })
        .catch(function (err) {
            alert('An error occurred! ' + err);
        });
}

// Function to add data from fetch() to DataTables
function appendData(data) {
    let mainContainer = document.getElementById("appendData");
    // Clear data first
    mainContainer.innerHTML = "";

    for (let i = 0; i < data.length; i++) {
        // We only want to display plays that haven't already started (i.e. past 1 hour before play-time) and that are profitable
        //if (moment(data[i].PlayDate).subtract(1, 'hours').diff() >= 0 && data[i].Calc.Profitable === true) {
        if (moment(data[i].PlayDate).subtract(15, 'minutes').diff() >= 0 && data[i].Calc.Profitable === true && data[i].Calc.NoRisk.ProfitPerCard <= 2) {
		let tr = document.createElement("tr");
            //TODO: Replace "undefined" Draw reward with a blank string

            // Determine which bet method options should be shown in the selector
            let betMethodSelectorOptions;

            if(data[i].Calc.NoRisk.Recommended == true) {
                betMethodSelectorOptions += "<option>NoRisk</option>"
            }

            if(data[i].Calc.HighRisk.Recommended == true) {
                 betMethodSelectorOptions += "<option>HighRisk</option>"
            }

            if(data[i].Calc.MedRisk.Recommended == true) {
                betMethodSelectorOptions += "<option>MedRisk</option>"
            }

            // The BetAmounts / ProfitPerCard are always going to be empty, because they will be filled later with a separate function
            tr.innerHTML = `
                <td data-order="${data[i].PlayDate}">${moment(data[i].PlayDate).calendar()}</td>
                <td><b>${data[i].Team1.Name}</b> (${data[i].Team1.Reward}) v. <b>${data[i].Team2.Name}</b> (${data[i].Team2.Reward}) ${data[i].Draw.Reward ? "v. <b>Draw</b> (" + data[i].Draw.Reward + ")" : ""}</td>
                <td>
                      <select style="width: auto;" class="form-control" id="${"betMethodSelector" + i}">
                            ${betMethodSelectorOptions}
                      </select>
                </td> 
                `;

            // Add all the data that was just generated to the HTML content of the page
            mainContainer.appendChild(tr);

            // We have to split the tr definition in two pieces, to allow the bet method to be selected before populating the bet amounts/profit per card
            // Need to run the betmethodswitcher function to initially populate the data
            let switcherData = betMethodSwitcher(data, i);
            tr.innerHTML +=`
                <td>${switcherData["BetAmounts"]}</td>
                <td data-order="${switcherData["ProfitPerCardRaw"]}" class="ProfitPerCard">${switcherData["ProfitPerCard"]}</td>
                <td><a target="_blank" rel="noreferrer" style="color:#E1DFDB;background-color:#431D2A" class="btn btn-block" href=${data[i].PlayUrl}>Go</a></td>    
            `

            // Listener to update table when bet method dropdown is switched
            $(document).on("change","#betMethodSelector"+i,function(){
                // We use this to look at child rows if they exist (i.e. when Responsive is working)
                var node = $(this).closest('li').length ?
                    $(this).closest('li') :
                    $(this).closest('tr');
                // The function will return an array containing the BetAmounts and ProfitPerCard values.
                let switcherData = betMethodSwitcher(data, i);
                // Update bet amounts column of row that contains the dropdown which was updated
                $('#dataTable').DataTable().cell(node, 3).data(switcherData["BetAmounts"]).draw(false);
                // Update profit per card column of row that contains the dropdown which was updated
                $('#dataTable').DataTable().cell(node, 4).data(switcherData["ProfitPerCard"]).draw(false);
                // Adapt the PPC cell's ordering attribute to be the raw profit per card
                $(this).closest(node).find(".ProfitPerCard").attr('data-order', switcherData["ProfitPerCardRaw"]);
                $('#dataTable').DataTable().cell(node, 4).invalidate();
            });
        }
    }
    console.log('End of data loading function');
}

// Function to initialize DataTables
function initDataTables(){
    $('#dataTable').DataTable( {
        dom: "Bfrtipl",
        buttons: [
            'colvis'
        ],
        responsive: true,
        // Order by the Profit per card column, descending
        order: [[ 4, "desc" ]],
        // Disallow sorting by bet amount & bet method columns
        "columnDefs": [
            { "orderable": false, "targets": [2, 3] }
        ],
        fixedHeader: true,
        autoWidth: true
    });
}

// Function to destroy DataTables
function destroyDataTables() {
    $('#dataTable').DataTable().destroy();
}

// Preloader clearer
function clearLoader(){
    $( ".loader" ).fadeOut(500, function() {
        $( ".loader" ).hide();
    });
}

// Preloader shower
function showLoader(){
    $( ".loader" ).show();
}
