/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var DEBUG = true;

var app = {
    // Application Constructor
    initialized: false,
    deviceInfo: {},
    config: {version: '1.0.0',
             name: 'MagicNet',
             map_object: '<b>Офис OÜ Interframe Kangelaste 41-38</b>',
             map_object_point: '59.389965,28.174345'},
    initialize: function() {
        if (this.initialized == false) {
            this.bindEvents();
            this.initialized = true;
        }
        if (DEBUG == false) {
            $('#debug_link').hide();
        }
    },
    log: function() {
        if (DEBUG == true) {
            console.log.apply(console, arguments);
        }
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        $(document).on('deviceready', this.onDeviceReady);
        $(window).on("orientationchange", this.getDeviceScreenInfo);
        $(document).on("offline", this.checkInternetConnection);
        $(document).on("online", this.checkInternetConnection);
//        $(document).bind('pageshow', 'div:jqmData(role="page"), div:jqmData(role="dialog")', this.pagePostChanged);
//        $(document).bind('pageinit', 'div:jqmData(role="page"), div:jqmData(role="dialog")', this.pagePreChanged);
    },
//    pagePostChanged: function(e) {
//        var pageType = $(this).data('pagetype');
//        app.log('pagePostChanged', pageType);
//    },
//    pagePreChanged: function(e) {
//        var pageType = $(this).data('pagetype');
//        app.log('pagePreChanged', pageType);
//    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicity call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.log('onDeviceReady');
        if (DEBUG == false) {
            setTimeout(function() {
                navigator.splashscreen.hide();
            }, 2000);
        }
        app.collectDeviceInfo();
        $.mobile.page.prototype.options.backBtnText = "Назад";
        $.mobile.page.prototype.options.addBackBtn = true;
    },
    checkInternetConnection: function(event) {
        app.log("checkInternetConnection");
        var connection = '';
        var callback = function(mode) {
            connection = mode;
        };
        navigator.connection.getInfo(callback);
        if (event.type === 'online') {
            if (app.deviceInfo['connection_status'] == 'offline') {
                $.mobile.changePage('#mainpage', {transition: 'pop', role: 'page'});
                app.online()
            }
            app.deviceInfo['connection_status'] = 'online';
        } else {
            app.deviceInfo['connection_status'] = 'offline';
            if (connection == Connection.NONE) {
                $.mobile.changePage('#nointernet', {transition: 'pop', role: 'dialog'});
            }
        }
        app.deviceInfo['connection'] = connection;
    },
    online: function() {
        this.log('Online mode');
        $('#map_link').show();
        $('#news_link').show();
    },
    offline: function() {
        this.log('Offline mode');
        $('#map_link').hide();
        $('#news_link').hide();
        $.mobile.changePage('#main', {transition: ''})
    },
    closeApp: function() {
         navigator.app.exitApp();
    },
    collectDeviceInfo: function() {
        this.getDeviceDPI();
        this.getDeviceScreenInfo();
        this.deviceInfo['device'] = device.name;
        this.deviceInfo['phonegap'] = device.phonegap;
        this.deviceInfo['platform'] = device.platform;
        this.deviceInfo['uuid'] = device.uuid;
        this.deviceInfo['version'] = device.version;
        this.deviceInfo['app_version'] = this.config.version;
        this.deviceInfo['app_name'] = this.config.name;
        this.deviceInfo['debug'] = DEBUG;
        this.log(this.deviceInfo);
    },
    getDeviceScreenInfo: function(event) {
        var orientation = undefined;
        var width = $(window).width();
        var height =  $(window).height();
        if (event && 'orientation' in event) {
            orientation = event.orientation;
            var temp = undefined;
            if (orientation == 'landscape' && width < height) {
                temp = height;
                height = width;
                width = temp;
            } else if(orientation == 'portrait' && height <= width) {
                temp = height;
                height = width;
                width = temp;
            }
        } else {
            if (width >= height) {
                orientation = 'landscape';
            } else {
                orientation = 'portrait';
            }
        }
        app.deviceInfo['device_width'] = screen.width;
        app.deviceInfo['device_height'] = screen.height;
        app.deviceInfo['orientation'] = orientation;
        app.deviceInfo['window_width'] = width;
        app.deviceInfo['window_height'] = height;
        app.resizePage(width, height, orientation);
        return width + ' x ' + height + ' orientation: ' + orientation
    },
    resizePage: function(width, height, orientation) {
        var activePage = $.mobile.activePage[0].id;
        if (activePage == 'map') {
            map_page.change_orientation(width, height, orientation);
        }
    },
    getDeviceDPI: function() {
        var pixelRatio = window.devicePixelRatio;
        var dpi = 'mdpi';
        if(pixelRatio >= 2) {
            dpi = 'xhdpi';
        } else if (pixelRatio >= 1.5) {
            dpi = 'hdpi';
        } else if (pixelRatio <= 0.75) {
            dpi = 'ldpi';
        }
        this.deviceInfo['dpi'] = dpi;
        this.deviceInfo['pixelratio'] = window.devicePixelRatio;
        return dpi
    }
};

var map_page = {
    load: function() {
        app.log("Map page loaded");
        $.mobile.loading("show");
        var map_canvas = $('#map_canvas');
        map_canvas.height(app.deviceInfo['window_height'] - $('#map_header').height() - 30);
        map_canvas.width(app.deviceInfo['window_width'] - 30);
        navigator.geolocation.getCurrentPosition(function(location) {
        app.log('location', location.coords.latitude, location.coords.longitude);
        map_canvas.gmap({'center': location.coords.latitude + ',' + location.coords.longitude, 'zoom': 12});
            map_canvas.gmap().bind('init', function(ev, map) {
                map_canvas.gmap('addMarker', {'position': location.coords.latitude + ',' + location.coords.longitude, 'bounds': true}).click(function() {
                    map_canvas.gmap('openInfoWindow', {'content': "<b>Ваше расположение: широта " + location.coords.latitude+", долгота " + location.coords.longitude} + "</b>", this);
                });
                map_canvas.gmap('addMarker',{'position': app.config['map_object_point'], 'bounds': true}).click(function() {
                    map_canvas.gmap('openInfoWindow', {'content': app.config['map_object']}, this);
                });
            });
        });
        $.mobile.loading("hide");
    },
    change_orientation: function(width, height, orientation) {
        alert(width + 'x' + height + '  ' + orientation);
        var map_canvas = $('#map_canvas');
        map_canvas.height(height - $('#map_header').height() - 30);
        map_canvas.width(width - 30);
    }
};

var news_page = {
    news_template: '<li data-theme="a"><a data-pk="{pk}" rel="external" class="ui-grid-a"><div class="ui-block-a">' +
        '</div><div class="ui-block-b"><p class="magic_title">{title}</p><br />' +
        '<p><span class="from">{author}</span>&nbsp;<span class="date">{date}</span>&nbsp;' +
        '<span class="views">Просмотров: {shows}</span></p></div></a></li>',
    news_template_with_image: '<li data-theme="a"><a data-pk="{pk}" rel="external" class="ui-grid-a"><div class="ui-block-a">' +
            '<img src="{image}" /></div><div class="ui-block-b"><p class="magic_title">{title}</p><br />' +
            '<p><span class="from">{author}</span>&nbsp;<span class="date">{date}</span>&nbsp;' +
            '<span class="views">Просмотров: {shows}</span></p></div></a></li>',
    news_item_template: '<div data-role=page data-add-back-btn=false><div data-role=header>' +
        '<a href="#news" data-icon="arrow-l">Назад</a><h1>Новости</h1></div><div data-role=content>' +
        '<h3>{title}</h3>{preview} {content}<div id="news_images_{pk}"></div><p><span class="from">{author}</span>&nbsp;' +
        '<span class="date">{date}</span>&nbsp;<span class="views">Просмотров: {shows}</span></p></div></div',
    news_item_template_with_image: '<div data-role=page data-add-back-btn=false><div data-role=header>' +
            '<a href="#news" data-icon="arrow-l">Назад</a><h1>Новости</h1></div><div data-role=content>' +
            '<h3>{title}</h3><img src={image} />{preview} {content}<div id="news_images_{pk}"></div><p><span class="from">{author}</span>&nbsp;' +
            '<span class="date">{date}</span>&nbsp;<span class="views">Просмотров: {shows}</span></p></div></div',
    clicks: 0,
    load: function() {
        app.log("News loaded");
        $.mobile.loading("show");
        var start = news_page.clicks * 20;
        var limit = 20;
        var size = news_page.calculateImageSize();
        var url = 'http://www.magicnet.ee/ru/news/api/list/' + start + '/' + limit + '/' + size + '/?callback=?';
        app.log(url);
        $.getJSON(url, function(data) {
            app.log(data);
            news_item = null;
            template = null;
            $.each(data.data.list, function(i, item){
                item.date = jQuery.timeago(item.published);
                if('image' in item && item.image) {
                    template = $.nano(news_page.news_template_with_image, item);
                } else {
                    template = $.nano(news_page.news_template, item);
                }
                news_item = $(template).on('click', 'a', function() {
                    news_page.news_item_page_load($(this).attr('data-pk'));
                });
                news_item.appendTo("#news_list").trigger('create');
                $('#news_list').listview('refresh');
            });
            $.mobile.loading("hide");
        });
    },
    more: function() {
        app.log("more clicked");
        news_page.clicks += 1;
        news_page.load();
    },
    calculateImageSize: function() {
       var width = parseInt((app.deviceInfo['window_width'] - 30) * 0.33);
       var height = parseInt(width * 0.5625);
       return width + 'x' + height
    },
    calculateFullImageSize: function() {
           var width = parseInt((app.deviceInfo['window_width'] - 30));
           var height = parseInt(width * 0.5625);
           return width + 'x' + height
    },
    news_item_page_load: function(pk) {
        app.log('news_item_page_load');
        $.mobile.loading("show");
        var size = news_page.calculateFullImageSize();
        var url = 'http://www.magicnet.ee/ru/news/api/show/' + pk + '/' + size + '/?callback=?';
        var newPage = null;
        var template = null;
        $.getJSON(url, function(data) {
            data.data.date = jQuery.timeago(data.data.published);
            if ('image' in data.data && data.data.image) {
                template = $.nano(news_page.news_item_template_with_image, data.data)
            } else {
                template = $.nano(news_page.news_item_template, data.data)
            }
            newPage = $(template).trigger('create');
            newPage.appendTo( $.mobile.pageContainer );
            var img = null;
            if ('images' in data.data && data.data.images) {
                $.each(data.data.images, function(i, item){
                    img = $('<p><img src="' + item + '"></p>');
                    img.appendTo('#news_images_' + pk);
                });
            }
            $.mobile.changePage( newPage );
            $.mobile.loading("hide");
        });
    }
};

var debug_page = {
    load: function() {
        app.log("Debug page loaded");
        $.mobile.showPageLoadingMsg();
        for (var key in app.deviceInfo) {
           var el = $('#' + key + '_value');
           if (el.length > 0) {
               app.log(key, app.deviceInfo[key]);
               el.text(app.deviceInfo[key]);
           }
        }
        $.mobile.hidePageLoadingMsg();
    }
};