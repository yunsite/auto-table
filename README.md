# AutoTable

Allow to create a table of records in minutes

## features

* Reorder Columns
* Show/Hide Columns
* Pagination (show more button)
* Legend (eg. showing 20 from 153 rows)
* Browser/user persistent state
* Auto publish
* Query for individual fields (using auto form)


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
const autoTable= AutoTable({options}) 
```

#### AutoTable options obj
|  name | req/opt  | type  | description  |  
|---|---|---|---|
|  id |  required | String  |  Unique id in all app for this table |
| collection  | required  | Mongo Collection  |  where the data comes from   |  
|  columns |  required  | Array \[Object\]  |  Objects in field array has this format see [fields Object format ](fieldsObject) |
|  schema |  required if use filter option (use null if not)| SimpleSchema  | You can and maybe you need use a diferent schema that you use for form see [fields Object format ](http://) |  
|  query |  optional | Object  | Mongo selector for filter the publication for publish all docs use {} |  
|  settings | optional  |  Object |  for general configuration  see [setting object format](settingObject)|  
|  publish | optional  |  Function | the context is same for Meteor.publish (it mean you can access this.userId) and have return true for allow publish |  
|  publishExtraFields | optional  |  Array | for publish extra fields|
|  link | optional  |  Function | receive as parameter the doc and the colunm key wehere click was, and have to return the href of the link, leave in blank for no link, you can handle the events (see below)|
publishExtraCollection:function(blueCards){
        let familiesIds=blueCards.map((bc)=>{
            return bc.familyId
        })
        familiesIds=_.uniq(familiesIds)
        return Meteor.users.find({_id: {$in: familiesIds }},{fields: {groups: 1, roles: 1}})
    },


##### <a name="fieldsObject"></a>fields Object format
```
 {
    label: 'email' //Optional {String} Name showed in header of column, if Filter option is on and this parameter is missing the label will be taken from Schema
    id: 'emails.address.0' // Required {String} Key og mongo field, (eg 'firstNamep' or 'emails.0.address')
    invisible: false, // Optional {Boolean} Initially hidden, have to be option.columnsDisplay to true for work 
    operator: '$regex', // Optional {String} required if option filter is enable
    render: function(val,path){return val}, // a function for render de value take 2 params, the actual value, and the path in the doc (eg emails.address.0), inside the function the context is doc.
    operators:  [  // Optional Array works for option filter
                   // the value of fields.operator (above) has to be present in fields.operators.operator (below) and it will be preselected
                   {  
                       label: 'Like', // Required {String} Label to show in options
                       shortLabel: '≈', // Required {String} label to show as selected
                       operator: '$regex', // Required {String} Mongo operator. eg this option will bel preselectes because is the same valu of operator (above)
                   },
                   {
                       label: 'Equal',
                       shortLabel: '=',
                       operator: '$eq',
                   },
                
                   {
                       label: 'Different',
                       shortLabel: '≠',
                       operator: '$ne',
                   },
                   {
                       label: 'More than',
                       shortLabel: '>',
                       operator: '$gt',
                   },
                   {
                       label: 'Less than',
                       shortLabel: '<',
                       operator: '$lt',
                   },
                   {
                       label: 'More or equal than',
                       shortLabel: '≥',
                       operator: '$gte',
                   },
                   {
                       label: 'Less or equal than',
                       shortLabel: '≤',
                       operator: '$lte',
                   },
                   {
                       label: 'In',
                       shortLabel: '[]',
                       operator: '$in',
                   },
                   {
                       label: 'Not in',
                       shortLabel: '][',
                       operator: '$nin',
                   },
                   {
                        label: 'No value',
                        shortLabel: '∃',
                        operator: '$exists',
                        options: [{label: 'Yes', value: 1},{ label: 'No', value: 0 }]
                   }
               ]
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
            filters: false, {Boolean}  //show filter for each field
            buttons: [klass: 'btn-etc',msg:'export/import'] //todo

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
            noRecords: 'There is not records ' //{String} No records message
            noRecordsCriteria: 'There is not families with this criteria' //{String} No records message when query is not empty
        },
        klass: { //individual class, works with bootstrap 3 out of the box
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
  {{>atTable at=myCollectionAutoTableInstance  query=query settings=settings}}
```


### Events

You can control the events in cells from your parent template, there the context (this) is the doc

```
Template.parentTempalte.events({
    'click .td'(e, instance){
        console.log(this)
    },
});

```
#### Argumens

|  name | req/opt  | type  | description  |  
|---|---|---|---|
|  at | required  | AutoTable instance  | The same used to configure the table (see above)  |
|  settings | optional  | Object  | override settings values (see above)  | 
|  customQuery | optional  | Object  | mongo selector, for filter doc in client side (if fields in selector are no showing then you have to included in publishExtraFields) | 

## Know Issues 

### Empty list:
* Be sure the code where you declare AutoTable instance is share (sever,client)
* If you are using query option, be sure all field in query are in columns or in publishExtraFields option.


### Depending on unknown package webtempest:animate
```sh
meteor add webtempest:animate
meteor remove webtempest:animate //if you want to removed (the packed is installed anyway)
```