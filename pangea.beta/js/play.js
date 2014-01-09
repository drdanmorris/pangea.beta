﻿var util = {
    inspect: function (obj) {
        return '[object]';
    }
};

var
    CLOCKSPEED = 1000
;



// parse the definition of an Item Property to yeild a PropertySchema object for the Property.
function parsePropertyDefinition(propname, propval) {
    var propertySchema = new PropertySchema(propname, propval);

    if (propval.match(/^[$\[]/)) {
        var defn = propval.match(/\[([^\]]+)\]/)[1];
        //console.log('match', util.inspect(match));

        var match;
        if (match = defn.match(/=(.+)/)) {
            propertySchema.type = 'xpn';
            propertySchema.template = match[1];
            propertySchema.updateFn = buildAdHocExpression(propertySchema);
        }
        else if (match = defn.match(/string\(([^\)]+)\)/)) {
            propertySchema.type = 'string';
            propertySchema.template = match[1];
            propertySchema.updateFn = getStringForCacheProp;
        }
        else if (match = defn.match(/double\(([^\)]+)\)/)) {
            propertySchema.type = 'double';
            propertySchema.template = match[1];
            propertySchema.updateFn = getDoubleForCacheProp;
        }
        else if (match = defn.match(/int\(([^\)]+)\)/)) {
            propertySchema.type = 'int';
            propertySchema.template = match[1];
            propertySchema.updateFn = getIntForCacheProp;
        }
        else if (match = defn.match(/chg\(([^\)]+)\)/)) {
            propertySchema.type = 'chg';
            propertySchema.template = match[1];
            propertySchema.updateFn = getChangeForCacheProp;
            propertySchema.reportMode = '*';
        }

        if (propval.match(/^\$/))
            propertySchema.isVolatile = false;

        if (match = propval.match(/([^\]]+)$/))
            propertySchema.reportMode = match[1];

    }

    return propertySchema;
}
function buildAdHocExpression(propertySchema) {
    var fn = '(function getExpressionForCacheProp(cacheprop){ var val; with(cacheprop.item){ val = ' + propertySchema.template + ' } return val; })';
    fn = eval(fn);
    return fn;
}
function getChangeForCacheProp(cacheprop) {
    var template = cacheprop.schema.template;
    var res = cacheprop.item['_' + template].change;
    return res;
}
function camelCase(string) {
    return string[0].toUpperCase() + string.substring(1);
}
function getStringForCacheProp(cacheprop) {
    var template = cacheprop.schema.template;
    var src = 'abcdefghijklmnopqrstuvwxyz';
    var res = template.replace(/{[^}]+}/g, function (match, number) {
        //console.log('match=' + match);
        var matchdetails = /(\d+)(?:\:(\w))/.exec(match);
        //console.log('matchdetails=' + matchdetails);
        var length, modifier;
        length = parseInt(matchdetails[1]);
        if (matchdetails.length == 3) {
            modifier = matchdetails[2];
        }

        var start = Math.floor((Math.random() * (src.length - length)) + 1);
        //console.log('match=' + match + ', start=' + start + ', length=' + length);
        var s = src.substring(start, start + length);

        if (modifier === 'U') {
            s = s.toUpperCase();
        }
        else if (modifier === 'C') {
            s = camelCase(s);
        }

        return s;
    });

    return res;
}
function getNumberForCacheProp(cacheprop, regex, fnGet) {

    // call cached update fn if we have already been here.  Note that this is a per-instance cached fn
    // and is different to the schema.updateFn (which is actually *this* function).
    if (cacheprop.updateFn)
        return cacheprop.updateFn();

    var template = cacheprop.schema.template;
    var match = regex.exec(template);

    // check if we are using a 'first>then' strategy
    if (template.match(/>/)) {
        var fn = fnGet(match, 3);

        // create cached update function for the subsequent calls which use the '>then' strategy
        cacheprop.updateFn = function () {
            var num = fn();
            if (num % 2 == 1) num *= -1;
            num = cacheprop.val + num;
            return num;
        };

    }
    else {
        var fn = fnGet(match, 1);

        // only a 'first' strategy;  cache a simple function to return random number.
        cacheprop.updateFn = function () {
            return fn();
        };
    }


    // first time - need to call the number generator to initiliase the property
    var info = {};  // grab a copy of any relevant numeric info (scale/precision)
    var num = fnGet(match, 1, info)();
    cacheprop.numericInfo = info;
    return num;
}
function getDoubleForCacheProp(cacheprop) {
    return getNumberForCacheProp(cacheprop, /(\d+)\:(\d+)(?:>(\d+)\:(\d+))?/, getDoubleFnFromMatch);
}
function getIntForCacheProp(cacheprop) {
    return getNumberForCacheProp(cacheprop, /(\d+)(?:-(\d+))?(?:>(\d+)(?:-(\d+))?)?/, getIntFnFromMatch);
}
function getIntFnFromMatch(match, idx) {
    var from = 0, to = parseInt(match[idx]);
    if (match[idx + 1]) {
        from = to;
        to = parseInt(match[idx + 1]);
    }
    return function () { return getInt(from, to); };
}
function getInt(min, max) {
    return Math.floor((Math.random() * max) + min);
}
function getDoubleFnFromMatch(match, idx, info) {
    var scale = parseInt(match[idx]);
    var precision = parseInt(match[idx + 1]);
    if (info) {
        info.scale = scale;
        info.precision = precision;
    }
    return function () { return getDouble(scale, precision); };
}
function getDouble(scale, precision) {
    var num = Math.random();
    while (num < 0.1) num *= 10;
    num = '' + (num * Math.pow(10, scale - precision));
    var rex = '\\d+\\.\\d{' + precision + '}';
    num = num.match(new RegExp(rex))[0];
    return parseFloat(num);
}

var PropertySchema = function (propname, propval) {
    this.name = propname;
    this.type = null;
    this.val = propval;
    this.isVolatile = true;
    this.template = null;
    this.updateFn = null;
    this.reportMode = null;
};
PropertySchema.prototype.isNumeric = function () {
    return 'int,double'.indexOf(this.type) > -1;
};

var CacheProperty = function (item, schema) {
    this.item = item;  // parent
    this.schema = schema;  // definition from __proto__
    this.val = schema.val;
    this.updateCount = 0;
    this.change = 0;
    this.init();
};
CacheProperty.prototype.update = function (iteration) {
    if (this.schema.isVolatile) {
        return this.updateProperty();
    }
    return false;
};
CacheProperty.prototype.applyChange = function (change) {
    this.change = change;
    this.val += change;
};
CacheProperty.prototype.init = function () {
    this.updateProperty();
    this.isNumeric = this.schema.isNumeric();
};
CacheProperty.prototype.updateProperty = function () {
    if (this.schema.updateFn) {
        var newval = this.schema.updateFn(this);
        if (this.isNumeric) {
            newval = parseFloat(newval.toFixed(4)); // avoid floating point issues like '0.999999999999'
            this.change = newval - this.val;
            this.change = parseFloat(this.change.toFixed(4));
        }
        var propname = this.schema.name;
        this.val = this.item[propname] = newval;
        this.updateCount++;
        //console.log(this.item.id + '::' + propname + ' set to ' + this.val);
        return true;
    }
    return false;
};


var asSchemaFn = function () {
    this.proplist = [];
    this.iteratePropNames = function (cb) {
        var my = this;
        var i = 0;
        _.each(this.proplist, function (prop) {
            cb(prop, i++);
        });
    }
    this.iterateCacheProperties = function (cb) {
        var my = this;
        var i = 0;
        _.each(this.proplist, function (prop) {
            cb(my['_' + prop], i++);
        });
    }
    this.update = function (iteration) {
        var updatedProps = 0;
        if (iteration % this.volatility == 0) {
            this.iterateCacheProperties(function (prop, propnum) {
                if (prop.update(iteration)) {
                    var propmask = (1 << propnum);
                    updatedProps |= propmask;
                }
            });
        }
        return updatedProps;
    }
    this.init = function () {
        //console.log('schemaFn init');
        var my = this;
        this.iteratePropNames(function (prop) {
            var cachePropName = '_' + prop;
            var schemaPropName = '__' + prop;
            my[cachePropName] = new CacheProperty(my, my[schemaPropName]);
        })

        //console.log('initialised: ' + util.inspect(my));
    }
    this.report = function (initial, updatedProps, conn) {
        var my = this;
        var report = { initial: initial };
        var my = this;
        this.iterateCacheProperties(function (prop, propnum) {
            var propname = prop.schema.name;
            if (prop.schema.reportMode === '*' || my.reportPropYN(initial, updatedProps, propnum)) {
                if (!report[propname]) {
                    var val = my[propname];
                    report[propname] = val;
                }
            }
        })
        console.log('report: ' + util.inspect(report));
        if (conn && conn.hasOwnProperty('write')) conn.write(JSON.stringify(report));
    }
    this.reportPropYN = function (initial, updatedProps, propnum) {
        if (initial) return true;
        if (updatedProps) {
            var propmask = (1 << propnum);
            return (propmask & updatedProps) == propmask;
        }
        return false;
    }
    this.applyOverrides = function (options, my) {
        if (options.overrides) {
            for (prop in options.overrides) {
                if (options.overrides.hasOwnProperty(prop)) {
                    var propval = options.overrides[prop];
                    var myprop = '_' + prop;
                    if (my[myprop]) {
                        my[myprop].val = propval;
                        my[prop] = propval;
                    }
                }
            }
        }
    }
    return this;
};






var Cache = function (connection) {
    this.connection = connection;
    this.schema = {};
    this.collection = [];
    this.collectionIndex = {};
    this.started = false;
    this.iteration = 0;
};
Cache.prototype.register = function (prefix, schema) {
    this.log('register', prefix + ' ' + util.inspect(schema));
    var itemSchema = this.parseSchema(schema);
    this.schema[prefix] = itemSchema;
};
Cache.prototype.subscribe = function (id, options) {
    options = _.extend({ volatility: null, overrides: null }, options);
    if (this.collectionIndex[id]) {
        this.log('subscribe', id + ' - already subscribed');
    }
    else {
        this.log('subscribe', id + ' - creating new subscription');
        var prefix = id.match(/^\D+/);
        //console.log('prefix=' + prefix);
        var schema = this.schema[prefix];
        if (schema) {
            var item = new schema(id, options);
            this.collection.push(item);
            this.collectionIndex[id] = item;
        }
    }

    var initialUpdate = item.report(true);

    this.start();
};
Cache.prototype.updateCache = function () {
    var my = this;
    var iteration = this.iteration++;
    _.each(this.collection, function (item) {
        var updatedprops = item.update(iteration);
        if (updatedprops) {
            //console.log('my.connection=' + my.connection);
            item.report(false, updatedprops, my.connection);
        }

    });
};
Cache.prototype.start = function () {
    if (this.started) return;
    this.log('start');
    var timer = setInterval(this.updateCache.bind(this), CLOCKSPEED);
    this.started = true;
};
Cache.prototype.log = function (type, detail) {
    console.log('(' + this.connection.connectionId + ') ' + type.toUpperCase() + ' - ' + (detail || ''));
};
Cache.prototype.parseSchema = function (schema) {

    // create unique ctor function for creating Items which conform to this schema
    var schemaFn = function (id, options) {
        this.id = id;
        this.init();
        this.applyOverrides(options, this); // schema properties can be overriden at construction-time
        this.volatility = options.volatility || getInt(1, 10);
    }
    // mixin some common schema function behaviour to the prototype of the unique schemaFn
    asSchemaFn.call(schemaFn.prototype);


    var propCount = 0;

    for (prop in schema) {
        if (schema.hasOwnProperty(prop)) {
            var propval = schema[prop];
            var propSchema = parsePropertyDefinition(prop, propval);
            var protoSchemaProp = '__' + prop;
            schemaFn.prototype[protoSchemaProp] = propSchema;
            schemaFn.prototype.proplist.push(prop);
            propCount += 1;

            if (propCount > 32)
                throw new Exception('Maximum limit of 32 Properties per Item exceded');
        }
    }

    //this.log('schemaFn.prototype', util.inspect(schemaFn.prototype));

    return schemaFn;
};






























var cache = new Cache({ connectionId: 1 });
var schema = {
    dref: '$[=id]*',
    title: '$[string(Spot, {3:U}/{3:U})]',
    b: '[double(5:3>2:2)]',
    a: '[=b+3]',
    chg: '[chg(b)]',
    chk: '[int(1-100)]'
};

cache.register('si', schema);
cache.subscribe('si100', {overrides:});


