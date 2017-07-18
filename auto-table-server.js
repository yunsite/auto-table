import './auto-table'
import {AutoTable} from "./auto-table"
import {_} from 'lodash'

import {getFields} from './util'
const Excel = require('exceljs')
export class Exporter {
    constructor(userId) {
        this.export = {}
        this.userId = userId

    }

    added(collection, _id, doc) {
        if (collection != 'counts') {
            this.export[collection] = this.export[collection] || []
            this.export[collection].push(doc)
        }
    }

    changed(collection, _id, doc) {
    }

    removed(collection, _id) {
    }

    ready() {

    }

    onStop(cb) {
        cb()
    }

    get() {
        return this.export
    }

}


Meteor.methods({
    'autoTable.export': async function (id, query, sort, columns) {

        const workbook = new Excel.Workbook();
        const worksheet = workbook.addWorksheet('My Sheet', {
            pageSetup: {orientation: 'landscape'}
        });
        const userId = this

        const autoTable = AutoTable.getInstance(id)
        //exportFamilies: function (query, order, columns) {
        this.unblock()
        const fields = getFields(autoTable.columns, autoTable.publishExtraFields)

        if (!_.isEmpty(autoTable.query)) {
            const autoTableQuery = _.cloneDeep(autoTable.query)
            query = _.defaultsDeep(autoTableQuery, query)
        }
        const exporter = new Exporter(this.userId)
        const publication = autoTable.publish.call(exporter, id, 9999, query, sort)

        if (publication === false) {
            throw new Meteor.Error(403, 'Access deny')

        }
        let rows = []
        if (publication !== true) {
            const dataObj = exporter.get()
            for (const key in dataObj) {
                rows = rows.concat(dataObj[key])
            }
        } else {
            rows = autoTable.collection.find(query, {fields, sort}).fetch()
        }
        //apply render function
        //and data onñy ewill be contain columns key
        const data = []

        let r = 2
        let c = 1
        const widths = {}
        let excelRow = worksheet.getRow(1)
        excelRow.height = 40
        for (let column  of columns) {
            const cell = excelRow.getCell(c)
            cell.value = column.label
            cell.font = {
                bold: true,
                size: 14
            }
            widths[c] = Math.max(widths[c] || 0, (column && column.label && column.label.length) || 0)
            c++
        }
        const odd = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'EEEEEEEE'}
            },
            even = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: {argb: 'FFFFFFFF'}
            },
            border = {
                top: {style: 'thin', color: {argb: '00000000'}},
                left: {style: 'thin', color: {argb: '00000000'}},
                bottom: {style: 'thin', color: {argb: '00000000'}},
                right: {style: 'thin', color: {argb: '00000000'}}
            },
            border2 = {
                top: {style: 'double', color: {argb: '00000000'}},
                left: {style: 'double', color: {argb: '00000000'}},
                bottom: {style: 'double', color: {argb: '00000000'}},
                right: {style: 'double', color: {argb: '00000000'}}
            };

        for (let row of rows) {
            excelRow = worksheet.getRow(r)
            excelRow.height = 30
            r++
            c = 1
            excelRow.fill = (r % 2 == 0) ? odd : even
            for (let column  of columns) {
                if (!column.invisible) {
                    const atColumn = _.find(autoTable.columns, {key: column.key})// find the same colum in the autotable declarion for get the render function (that is not in passed columns)
                    let val
                    if (typeof atColumn.render == 'function') {

                        val = atColumn.render.call(row, _.get(row, column.key))
                        if (typeof val == 'string') {
                            val = val.replace(/<(?:.|\n)*?>/gm, ' ');
                        }
                    } else {
                        val = _.get(row, column.key)
                    }
                    widths[c] = Math.max(widths[c] || 0, (val && val.toString().length) || 0)
                    const cell = excelRow.getCell(c)
                    cell.value = val
                    cell.border = r == 1 ? border2 : border
                    c++
                    val = ''
                }
            }
        }
        for (let c in widths) {
            const col = worksheet.getColumn(parseInt(c))
            col.width = Math.min(widths[c], 30)
        }
        const file = Random.secret()
        try {
            fs.mkdirSync(process.env.PWD + '/.xlsx/')
        } catch (e) {
        }
        const path=process.env.PWD + '/.xlsx/' + file
        const now=new Date().getTime()
        const result = await workbook.xlsx.writeFile(path)
        console.log('time creating xls', new Date().getTime() - now )
        Meteor.setTimeout(() => {
            fs.unlink(path, (err) => {
                if (!err) console.error('xls removed , some problem occurred removing before')
            })
        }, 1000 *  15)
        return file

    }
})

Meteor.publish('atPubSub', function (id, limit, query = {}, sort = {}) {

    let time = new Date().getTime()
    check(id, String)
    check(limit, Number)
    check(query, Object)
    check(sort, Object)

    const autoTable = AutoTable.getInstance(id)
    if (!autoTable) {
        console.error('Can\'t find AutoTable instance for id ' + id + ', be sure you declare the instance in a share code (client and server side)')
        throw new Meteor.Error('Can\'t find AutoTable instance, be sure you declare the instance in a share code (client and server side)')
    }


    const projection = getFields(autoTable.columns, autoTable.publishExtraFields)

    if (!_.isEmpty(autoTable.query)) {
        const autoTableQuery = _.cloneDeep(autoTable.query)
        query = _.defaultsDeep(autoTableQuery, query)
    }
    const publication = autoTable.publish.call(this, id, limit, query, sort)
    if (publication === false) {
        //user not allow to this publication
        return this.ready()
    }
    if (publication !== true) {
        //low level publication
        return publication
    }
    //default publication [cursor]
    if (autoTable.settings.options.showing) {

        let Counts = Package['tmeasday:publish-counts']
        if (!Counts) throw new Meteor.Error('Please install tmeasday:publish-counts pacage for use showing option')
        Counts = Counts.Counts
        Counts.publish(this, 'atCounter' + id, autoTable.collection.find(query, {limit, sort}), {noReady: true});
    }
    const cursor = autoTable.collection.find(query, {fields: projection, sort, limit})
    let publications = [cursor]
    if (typeof autoTable.publishExtraCollection == 'function') {
        publications = publications.concat(autoTable.publishExtraCollection.call(this, cursor))
    }
    return publications
    if (Meteor.isDevelopment) console.log('atPubSub', id, new Date().getTime() - time)

})

Meteor.publish('atSettings', function (atId) {
    check(atId, String)
    if (!this.userId) return this.ready()
    return AutoTable.collection.find({atId, $or: [{userId: this.userId}, {userId: null}]})
})

const fs = require('fs')
WebApp.connectHandlers
    .use("/download/", function (req, res, next) {

        const parts = req.url.split("/");
        const file = parts[1]
        if (!file) {
            res.writeHead(404);
            res.end();
            return
        }
        console.log(file)
        const workbook = new Excel.Workbook();
        workbook.xlsx.readFile(process.env.PWD + '/.xlsx/' + file)
            .then(function () {
                console.log(1)
                res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
                res.setHeader("Content-Disposition", "attachment; filename=" + "file.xlsx");
                res.writeHead(200);
                console.log(2)
                workbook.xlsx.write(res)
                    .then(function () {
                        console.log(3)
                        res.end();
                        fs.unlink(process.env.PWD + '/.xlsx/' + file)
                    });
            })
            .catch(function (e) {
                console.log(4)
                console.log(e)
                res.writeHead(404);
                res.end('1');
            })

        console.log(5)
    });
