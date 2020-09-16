# gambitprofit-api-frontend
Custom frontend HTML files for Jon's site

[![Netlify Status](https://api.netlify.com/api/v1/badges/d0fb678e-6d37-4968-8d9c-bb06aadd8b05/deploy-status)](https://app.netlify.com/sites/eager-ramanujan-e8c479/deploys)

## index.html

Index.html displays all of the data pulled from the API as long as it meets two conditions:

a) The play is not expired (MomentJS automatically calculates this, all plays within or past 1 hour before their playtime will be hidden)

b) The play is profitable (which is calculated on the API side, setting boolean Calc.Profitable=True)

### What to edit if Gambit card price changes

- gambitDiscountPercent variable in HTML files
