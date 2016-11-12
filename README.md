# AutoTable

Allow to create a table of records in minutes

## features

* Reorder Columns
* Show/Hide Columns
* Pagination (show more button)
* Legend (eg. showing 20 from 153 rows)
* Browser/user persistent 
* Auto publish
* Search for indiviual fields (using auto form)


## installation

```sh
    metoeor add cesarve:auto-table
```
```sh
    metoeor add tws:bootstrap #or your preferer package for preformated table
```
```sh
    metoeor add tmeasday:publish-counts #if you will use showing option see bellow (no recommended for large date sets)
```
```sh
    metoeor add aldeed:autoform #if you will use filters option
```



## Usage

### Configuration 
```javascript
//have to be share code
const autoTable= AutoTable(id,collection,fields,settings)
```

#### AutoTable Arguments
|  name | req/opt  | type  | description  |  
|---|---|---|---|
|  id |  required | String  |  Unique id in all app for this table |
| collection  | required  | Mongo Collection  |  where the data comes from   |  
|  fields |  required if not schema present | Array \[Object\]  |  Objects in field array has this format see [fields Object format ](fieldsObject) |  
|  schema |  required if use filter option | SimpleSchema  |  see [fields Object format ](http://) |  
|  settings | optional  |  Object |  for general configuration  see [setting object format](settingObject)|  

#### <a name="fieldsObject"></a>fields Object format
```
 {
    label: {String} //Name showed in header of column
    id: {String} //Key og mongo field, (eg 'firstNamep' or 'emails.0.address')
    invisible: {Boolean} //Initially hidden, have to be option.columnsDisplay to true for work 
}
```
#### <a name="settingObject"></a>setting object format
``` 
    {
        options: {
            loadingTemplate: 'atLoading',// {String} name of loading template (spinner)
            columnsSort: true, // {Boolean} allow to order the columns
            columnsDisplay: true, // {Boolean} allow to show/hide columns
            showing: false, {Boolean} //show legend (Showing 15 records from 143) //need to install 'tmeasday:publish-counts' package
            filter: false, {Boolean}  //show filter for each field
        },
        msg: { // Messages (ypu can custumize to any languaje )
            columns: 'Columns', //{String} text for Button show/hide columns 
            showMore: 'Show more', //{String} text for Button show more  (accept html)
            showing: 'Showing', //{String} first text for legend (accept html)
            from: 'from', //{String} second text for legend (accept html)
            sort:{
                asc: '<i class="glyphicon glyphicon-triangle-top"></i>', //{String} sort asc icon/text (accept html)
                desc: '<i class="glyphicon glyphicon-triangle-bottom"></i>'//{String} sort desc icon/text (accept html)
            },
            noRecords: 'There is not families with this criteria' //{String} No records message
        },
        Klass: { //individual class, works with bootstrap 3 out of the box 
            tableWrapper: 'table-responsive',
            table: 'table table-bordered table-condensed table-striped',
            link: '',
            transitionIn: 'fadeInLeftBig',
            transitionOut: 'fadeOutRightBig',
            showMore: 'btn btn-block btn-default',
            showingWrapper: 'row',
            showing: 'col-xs-12 text-right small',
            noRecordsWrapper: 'row text-center',
            noRecords: 'col-xs-12 col-sm-12 col-md-12 col-lg-12'
        }
    }

``` 
## Usage

```Blaze
  {{>atTable id='id1' query=query settings=settings}}
```
#### Argumens

|  name | req/opt  | type  | description  |  
|---|---|---|---|
|  id | required  | String  | The same used to configure the table (see above)  | 
| query | optional | Object | Mongo selector to filter the docs 
|  settings | optional  | Object  | override settings values (see above)  | 

## Know Issues 

Depending on unknown package webtempest:animate
```sh
meteor add webtempest:animate
meteor remove webtempest:animate //if you want to removed (the packed is installed anyway)
```