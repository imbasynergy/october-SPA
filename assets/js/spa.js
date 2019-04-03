/**
 * Модуль перевода
 * @param {String} text
 * @returns {window.gettext.data|Window.gettext.data}
 */

if (window.gettext === undefined) {

    var gettext = function (text) {
        if (window.gettext.data && window.gettext.data[window.gettext.locale] && window.gettext.data[window.gettext.locale][text]) {
            text = window.gettext.data[window.gettext.locale][text];
            for (var i = 1; i < arguments.length; i++) {
                text = text.replace("%" + i + "s", arguments[i])
            }
            return text
        }
        for (var i = 1; i < arguments.length; i++) {
            text = text.replace("%" + i + "s", arguments[i])
        }
        return text;
    }
    window.gettext.data = {};
    window.gettext.locale = 'en'
    if (navigator.language) {
        window.gettext.locale = navigator.language
    }
    gettext.setTranslate = function (lang, arr) {
        window.gettext.data[lang] = arr
    }
    gettext.setLocale = function (lang) {
        window.gettext.locale = lang
    }
    gettext.getLocale = function () {
        return window.gettext.locale
    }
}


if (!window.isCordova) {
    // Использовать HistoryApi
    window.isCordova = function () {
        if (window.cordova) {
            return true;
        }
        else if (window.parent && window.parent.cordova) {
            return true;
        } else {
            return false;
        }
    }
}

if (!window.openExternalURL) {
    window.openExternalURL = function (url) {
        return url;
    }
}

if (!window.SpaJs) {

    /**
     * Класс приложения single page application
     * @returns {spajs}
     */
    window.SpaJs = function (spa_name) {
        this.spa_name = spa_name

        var spajs = this;
        spajs.version = "2.2";

        /**
         * Указывает на то как прошла иницитализация
         * @type Boolean
         * @private
         */
        spajs.initSuccess = false;

        /**
         * Указывает на то что иницитализация была уже запущена
         * @type Boolean
         * @private
         */
        spajs.initProgress = false;

        spajs.opt = {};

        spajs.opt.holder = "body"

        /**
         * Путь к папке с аватарками пользователей
         * @type String
         */
        spajs.opt.avatar_prefix = "";

        spajs.opt.menu_url = "spa"

        /**
         * Указывает добавлять или не добавлять пареметры урла
         * @type Boolean
         */
        spajs.opt.addParamsToUrl = true
        spajs.opt.allSpa = false

        if (window.cordova) {
            spajs.opt.allSpa = true;
        }

        /**
         * Масив с описанием пунктов меню
         * @type Array
         */
        spajs.opt.menu = []

        /**
         * @param {object} options
         *
         * Генерирует события
         * onOffline
         * onOnline
         * onAnyTabActivated
         *
         */

        spajs.linkInit = function () {
            let linksArr = $(".spa-link");

            for (let i = 0; i < linksArr.length; i++) {
                if ($(linksArr[i]).attr('data-spa-link')) {
                    continue;
                } else if ($(linksArr[i]).attr('data-request')) {
                    continue;
                }
                $(linksArr[i]).on('click', function () {
                    if (this.href) {
                        spajs.open(this.href);
                        return false;
                    };
                }).attr('data-spa-link', 'true')
            }

            let spaLink = $(".spa-link a");

            for (let i = 0; i < spaLink.length; i++) {
                if ($(spaLink[i]).attr('href') != undefined) {
                    if ($(spaLink[i]).attr('data-spa-link')) {
                        continue
                    } else if ($(spaLink[i]).attr('data-request')) {
                        $(spaLink[i]).addClass('not-spa-link')
                        continue;
                    }
                    $(spaLink[i]).on('click', function () {
                        // debugger;
                        if (this.href.split('#')[0] != window.location.href.split('#')[0]){
                            spajs.open(this.href);
                            return false;
                        } else if (this.href) {
                            // spajs.open(this.href);
                            return;
                        }
                    }).attr('data-spa-link', 'true')
                }
            }
        };

        spajs.init = function (options) {
            // debugger
            this.linkInit();
            if (spajs.initProgress === true) {
                return;
            }

            spajs.initProgress = true;

            for (var i in options) {
                if (spajs.opt[i] && typeof (spajs.opt[i]) == "object") {
                    for (var j in options[i]) {
                        spajs.opt[i][j] = options[i][j]
                    }
                }
                spajs.opt[i] = options[i]
            }

            // Фиксируем факт того что страница не активна http://javascript.ru/forum/events/2498-kak-opredelit-aktivnoe-okno-vkladku.html
            jQuery(window).blur(function () {
                // Здесь что угодно после ухода в другую вкладку
                spajs.isActiveTab = false;
            });

            // Фиксируем факт того что страница активна
            jQuery(window).focus(function () {
                // Здесь что угодно после возвращения во вкладку
                spajs.isActiveTab = true;

                // Уведомим всех о том что одна из вкладок чата активирована
                tabSignal.emitAll("onAnyTabActivated", {})
                tabSignal.emitAll(spa_name + "onAnyTabActivated", {})
            });

            var lastOnlineStatus = undefined;
            setInterval(function () {
                var status = spajs.isOnline();
                //console.warn("offline event", status, lastOnlineStatus, status !== lastOnlineStatus && lastOnlineStatus !== undefined)
                if (status !== lastOnlineStatus && lastOnlineStatus !== undefined) {
                    if (status) {
                        // Переход в online
                        console.warn("online event");
                        setTimeout(function () {
                            if (!spajs.isOnline()) {
                                return;
                            }

                            tabSignal.emitAll("onOnline", {})
                            tabSignal.emitAll(spa_name + "onOnline", {})
                        }, 5000)
                    }
                    else {
                        // Переход в offline
                        console.warn("offline event")
                        tabSignal.emitAll("onOffline", {})
                        tabSignal.emitAll(spa_name + "onOffline", {})
                    }
                }
                lastOnlineStatus = status;
            }, 500)

            this.currentURL = window.location.href;

            if (spajs.opt.useHistoryApi) {
                // Код обработки popstate перенесён сюда из spajs чтоб кнопка назад возвращала на список контактов и не дальше
                // и даже если истории раньше не было то всё равно кнопка назад ВСЕГДА возвращала на список контактов
                // по этому опция spajs.opt.useHistoryApi взята из spajs а не paradiseChat хоть это архитектурно не красиво

                //console.log("bind for popstate event")
                //jQuery(window).bind('popstate', function(event)
                // debugger;
                window.addEventListener('popstate', function (event) {
                    // debugger
                    if(window.location.href.split('#')[0] != spajs.currentURL.split('#')[0]){
                        spajs.openMenuFromUrl(window.location.href, { after_push_state: true })
                    } else {
                        return;
                    }
                });
            }
            else {
                //console.log("not bind for popstate event")
            }
        }

        spajs.pushState = function(new_URL){
            window.history.pushState({ page_new_url: new_URL }, new_URL, new_URL);
            this.currentURL = window.location.href;
            return;
        }

        /**
         * Для обработки клика на ссылки
         * @param {string} url
         * @param {string} title
         * @returns {boolean}
         *
         * @example spajs.openURL("https://app.chat-server.comet-server.com/dev-18/t-chatterbox/") (Надо передавать полный урл)
         */
        spajs.openURL = function (url, title) {
            // debugger
            var res = spajs.openMenuFromUrl(url, { withoutFailPage: true })
            if (!res) {
                return false;
            }
            var state = res.state()
            return state == "rejected"
        }

        /**
         * Открывает пункт меню на основе параметров из url ( window.location.href )
         * Ищет в адресе парамет spajs.opt.menu_url и на основе его значения открывает пункт меню.
         * @returns {boolean} Если параметр не найден или информации в нём содержится о не зарегистрированном menuId то вернёт false
         */
        spajs.openMenuFromUrl = function (event_state, opt = {}) {
            if (event_state && event_state.indexOf(window.location.hostname) == -1) {
                window.location.replace(event_state)
                return
            }

            if (event_state) {
                if (event_state.indexOf("//") == 0) {
                    event_state = window.location.protocol + event_state
                }
                opt.menuId = event_state
            }
            else {
                // Если menu_url не задан то используем window.location.hash
                opt.menuId = window.location.pathname
            }
            return spajs.open(opt)
        }

        /**
         * Открывает окно с произвольным содержимым
         * @param string menuId
         * @param array addUrlParams Дополнительная информация которая будет передана в .onOpen для обработчика пункта меню
         * @param boolean notAddToHistory не добавлять переход в историю браузера
         * @param object event_state
         * @public
         *
         * @note выполняется синхронно но событие onOpen у пункта меню может работать не синхронно и зависит от реализыции колбека навешаного на onOpen
         * @deprecated Заменён методом spajs.open
         */

        // spajs.getAjaxURL = function (url) {
        //     if (window.app_host != undefined && window.app_host != url) {
        //         url = window.app_host
        //     }
        //     return url;
        // }

        spajs.openMenu = function (menuId, addUrlParams, notAddToHistory, event_state) {
            return spajs.open({
                menuId: menuId,
                addUrlParams: addUrlParams,
                notAddToHistory: notAddToHistory,
                event_state: event_state
            })
        }

        spajs.setUrlParam = function (params, title) {
            var url = window.location.pathname + "?" + params.toString();
            if (typeof params === "object") {
                var new_url = window.location.href;
                for (var i in params) {
                    if (!params.hasOwnProperty(i)) {
                        continue;
                    }

                    var name = i;
                    var value = params[i];

                    if (value == undefined) {
                        // Если параметр равен undefined то его надо удалить из строки урла
                        new_url = new_url.replace(new RegExp(name + "=[^&\/]+"), "");
                    }
                    else {
                        if (!new_url.match(new RegExp(name + "=[^&\/]+"))) {
                            if (new_url.indexOf("?") != -1) {
                                new_url += "&" + name + "=" + value;
                            }
                            else {
                                new_url += "?" + name + "=" + value;
                            }
                        }
                        else {
                            new_url = new_url.replace(new RegExp(name + "=[^&\/]+"), name + "=" + value);
                        }
                    }
                }
                url = new_url.replace(/&+/img, "&").replace(/&+$/img, "").replace(/\?+$/img, "").replace(/\?&+/img, "?")
            }

            if (!spajs.opt.addParamsToUrl) {
                url = window.location.href;
            }

            return new_url;
        }

        spajs.getUrlParam = function (name, event_state) {
            var url_param = window.location.href.replace(/^.*?[#?](.*)$/, "$1");
            if (event_state !== undefined && event_state.url) {
                url_param = event_state.url.replace(/^.*?[#?](.*)$/, "$1");
            }

            var param = url_param.match(new RegExp(name + "=[^&\/]+"), "g")
            if (!param || !param.length) {
                return false;
            }

            return param[0].replace(name + "=", "").replace(/#$/, "")
        }

        spajs.getAllUrlParam = function (event_state) {
            var url_param = window.location.href.replace(/^.*?[#?](.*)$/, "$1");
            if (event_state !== undefined && event_state.url) {
                url_param = event_state.url.replace(/^.*?[#?](.*)$/, "$1");
            }

            var param = url_param.split(/[&?]/g)

            var res = {}

            if (param && param.length) {
                for (var i = 0; i < param.length; i++) {
                    param[i] = param[i].split("=")
                    res[param[i][0]] = param[i][1];
                }
            }

            return res
        }

        /**
         * Добавляет произвольный пункт меню
         * @param {object} menu Описание пункта меню
         * @public
         *
         *
         * Пример добавления произвольного пункта меню.
            spajs.addMenu({
                id:"terms_of_use",              // id комнаты должен соответсвовать регулярному выражению  [A-z9-0_]{ 4,64} или быть объектом класса RegExp
                name:"Условия использования",   // Имя кнопки
                urlregexp:[/^param;[0-9]+$/]    // Массив регулярных выражений урла которым соответсует данный пункт меню
                url: "#",                       // url ссылки
                type:"bottom",                  // Тип пункта меню (false|bottom|custom)
                menuHtml: "html code",          // Если тип меню custom то из этого поля берётся код на вставку его в левую колонку
                priority:1,                     // Приоритет для сортировки порядка блоков

                /*
                 *  callback вызываемый по открытии этого пункта меню
                 *  @param object holder html элемент в списке меню
                 *  @param object menuInfo Информация о том пункет меню на который совершён переход
                 *  @param object data Объект с данными урла, { reg:{}, url:{} } где reg - совпадения в регулярке, url - данные всех параметров урла
                 * /
                onOpen:function(holder, menuInfo, data)
                {
                    jQuery(holder).insertTpl(jQuery("#terms_of_use").html())
                },
                /*
                 *  callback вызываемый по открытии другого пункта меню и закрытии этого пункта меню
                 *  @param object menuInfo Информация о том пункет меню на который совершён переход
                 * /
                onClose:function(menuInfo)
                {

                },

                /*
                 *  callback вызываемый по завершению вставки пункта меню в меню
                 *  @param object holder html элемент в списке меню
                 * /
                onInsert:function(holder)
                {

                },
            })

         *
         * Примечание:
         * Если тип меню type=custom то в коде этого эемента меню надо самостоятельно разместить вызов функции spajs.openMenu('menu_id'); для клика и открытия.
         * @note выполняется синхронно
         */
        spajs.addMenu = function (menu) {
            if (!menu.id) {
                menu.id = Math.random()
            }

            if (!menu.type) {
                menu.type = "custom"
            }

            var targetBlock = jQuery("#left_sidebar")

            for (var i in spajs.opt.menu) {
                if (spajs.opt.menu[i].id == menu.id) {
                    // Такой пункт уже есть в меню
                    return;
                }
            }

            if (!menu.priority) {
                menu.priority = 0;
            }

            spajs.opt.menu.push(menu)

            if (menu.type == "custom") {
                targetBlock.append('<div data-index="' + menu.priority + '" >' + menu.menuHtml + '</div>');
            }
            else if (menu.type == "hidden") {
                // Невидимый пункт меню.
            }

            //spajs.sortMenu(targetBlock)
            if (menu.onInsert) {
                menu.onInsert(jQuery("#spajs-menu-" + menu.id))
            }
        }

        spajs.currentOpenMenu = undefined
        spajs.pageLoaded = new jQuery.Deferred();

        window.addEventListener('load', function (e) {
            console.info("window.loaded")
            spajs.pageLoaded.resolve()
        });

        $(document).ready(function (e) {
            console.info("window.ready")
            spajs.pageLoaded.resolve()
        });

        spajs.loadServerPage = function (url, after_push_state) {
            var def = new jQuery.Deferred();

            jQuery.ajax({
                type: "POST",
                url: url,
                // data: 'ajax=1',
                success: function (res) {
                    if (res.error_redirect_reload) {
                        def.reject(res)
                        window.location.replace(res.error_redirect_reload);
                        return;
                    }

                    if (res.error_redirect) {
                        def.reject(res)
                        return spajs.openURL(res.error_redirect);
                    }

                    let dom = $(res)

                    for (let i = 0; i < dom.length; i++) {
                        if (dom[i].id == "spa-page-content") {
                            reloadElem = dom[i]
                            break
                        }
                    }
                    // вынести в конфиг ид элемента
                    $("#spa-page-content").replaceWith(reloadElem)

                    tabSignal.emit("loading.newPage")

                    // tabSignal.on('loading.newPage', ()=>{
                    //    $(window).trigger("load");

                    // вынести в конфиг класс или список классов
                    spajs.linkInit();

                    def.resolve()
                },
                error: function (res) {
                    def.reject()
                },
            });
            return def.promise();
        }
        
        spajs.removeAllNavigation = function()
        {
            spajs.opt.menu = []
        }
        /**
         * Открывает окно с произвольным содержимым
         * @param string menuId
         * @param array addUrlParams Дополнительная информация которая будет передана в .onOpen для обработчика пункта меню
         * @param boolean notAddToHistory не добавлять переход в историю браузера
         * @param object event_state
         * @public
         *
         * @return  jQuery.Deferred обещание полученое от функции open или обещание созданое в нутри функции
         * @note выполняется синхронно но событие onOpen у пункта меню может работать не синхронно и зависит от реализыции колбека навешаного на onOpen
         */
        spajs.open = function (opt) {

            this.currentURL = window.location.href;

            if (typeof opt == "string") {
                opt = {
                    menuId: opt
                }
            }
            let page_new_url = opt.menuId;
            if (!/^http/.test(page_new_url)) {
                page_new_url = window.location.origin + "/" + opt.menuId;
            }
            console.log("spajs.open: `" + opt.menuId + "`", page_new_url)
            if (!opt.menuId) {
                opt.menuId = "";
            }

            if (opt.reopen === undefined) {
                opt.reopen = true;
            }

            var def = new jQuery.Deferred();
            if (!spajs.opt.addParamsToUrl && opt.event_state == undefined) {
                opt.event_state = {}
                opt.event_state.url = window.location.href;
            }

            var regExpRes = []
            var menuInfo = undefined;

            for (var i in spajs.opt.menu) {
                val = spajs.opt.menu[i]
                if (spajs.opt.menu[i].url_parser != undefined) {
                    for (var j in spajs.opt.menu[i].url_parser) {
                        var parsed = spajs.opt.menu[i].url_parser[j](opt.menuId)
                        if (parsed) {
                            regExpRes = parsed
                            menuInfo = spajs.opt.menu[i]
                            break;
                        }
                    }
                }
                else if (spajs.opt.menu[i].urlregexp != undefined) {
                    for (var j in spajs.opt.menu[i].urlregexp) {
                        if (spajs.opt.menu[i].urlregexp[j].test(opt.menuId)) {
                            regExpRes = spajs.opt.menu[i].urlregexp[j].exec(opt.menuId)
                            menuInfo = spajs.opt.menu[i]
                            break;
                        }
                    }
                }
                else if (spajs.opt.menu[i].id == opt.menuId) {
                    menuInfo = spajs.opt.menu[i]
                    break;
                }
            }


            tabSignal.emit("loading.unload");

            //console.log("openMenu", menuId, menuInfo)
            if (!menuInfo || !menuInfo.onOpen) {
                $("body").addClass("in-loading");
                $.when(spajs.loadServerPage(page_new_url, opt.after_push_state)).done(() => {
                    $("body").removeClass("in-loading");
                    if (spajs.opt.useHistoryApi && !opt.after_push_state) {
                        spajs.pushState(page_new_url);
                    }
                    def.resolve()
                }).fail((err) => {
                    $("body").removeClass("in-loading");
                    tabSignal.emit("spajs.not_registered", opt)
                    console.error("URL not registered", opt.menuId, opt)
                    def.reject({ detail: "Error URL not registered", status: 404 })
                    //throw { text:"URL not registered " + opt.menuId, code:404};
                })

                return def.promise();
            }

            if (spajs.currentOpenMenu && menuInfo.id == spajs.currentOpenMenu.id && !opt.reopen) {
                console.warn("Re-opening the menu", menuInfo)
                if (spajs.opt.useHistoryApi && !opt.after_push_state) {
                    spajs.pushState(page_new_url);
                }
                def.resolve()
                return def.promise();
            }

            if (opt.addUrlParams === undefined) {
                opt.addUrlParams = {}
            }

            if (spajs.opt.menu_url) {
                opt.addUrlParams[spajs.opt.menu_url] = opt.menuId;
                if (!opt.notAddToHistory) {
                    var url = spajs.setUrlParam(opt.addUrlParams, menuInfo.title || menuInfo.name)
                    if (opt.event_state) {
                        opt.event_state.url = url;
                    }
                }
            }
            else if (!opt.notAddToHistory) {
                var url = spajs.setUrlParam(opt.menuId, menuInfo.title || menuInfo.name)
                if (opt.event_state) {
                    opt.event_state.url = url;
                }
            }

            if (spajs.currentOpenMenu && spajs.currentOpenMenu.onClose) {
                //console.log("onClose", spajs.currentOpenMenu)
                spajs.currentOpenMenu.onClose(menuInfo);
            }

            var data = {}
            data.url = spajs.getAllUrlParam(opt.event_state)
            data.reg = regExpRes

            if (menuInfo.hideMenu) {
                jQuery(spajs.opt.holder).addClass("spajs-spa-show-page");
            }


            //console.log("onOpen", menuInfo)
            if (spajs.currentOpenMenu && spajs.currentOpenMenu.id) {
                jQuery("body").removeClass("spajs-active-" + spajs.currentOpenMenu.id)
            }
            else {
                //error("Не удалён предыдущий класс меню", spajs.currentOpenMenu, menuInfo)
            }
            jQuery(spajs.opt.holder).addClass("spajs-active-" + menuInfo.id);

            spajs.urlInfo = { menuInfo: menuInfo, data: data }
            tabSignal.emit("spajsOpen", { menuInfo: menuInfo, data: data })
            tabSignal.emit(spa_name + "spajsOpen", { menuInfo: menuInfo, data: data })
            var res = menuInfo.onOpen(spajs.opt.holder, menuInfo, data);
            if (res) {
                // debugger;
                // in-loading
                jQuery("body").addClass("in-loading")

                //console.time("Mopen")
                jQuery("#spajs-menu-" + menuInfo.id).addClass("menu-loading")
                setTimeout(function () {
                    jQuery.when(res).done(function () {
                        //console.timeEnd("Mopen")
                        jQuery("#spajs-menu-" + menuInfo.id).removeClass("menu-loading")

                        // in-loading
                        jQuery("body").removeClass("in-loading")
                        if (spajs.opt.useHistoryApi && !opt.after_push_state) {
                            spajs.pushState(page_new_url);
                        }
                        def.resolve()
                    }).fail(function (e) {
                        //console.timeEnd("Mopen")
                        jQuery("#spajs-menu-" + menuInfo.id).removeClass("menu-loading")

                        // in-loading
                        jQuery("body").removeClass("in-loading")

                        def.reject(e)
                    })
                }, 0)
            }
            else {
                jQuery("body").removeClass("in-loading")
                if (spajs.opt.useHistoryApi && !opt.after_push_state) {
                    spajs.pushState(page_new_url);
                }
                def.resolve()
                res = def
            }

            // Выделяем нашу комнату как активную в меню с лева
            jQuery("#left_sidebar li").removeClass("active")
            jQuery("#spajs-menu-" + menuInfo.id).addClass("active")

            spajs.currentOpenMenu = menuInfo;

            if (opt.callback) {
                opt.callback();
            }

            $.when(res).always(() => {

                console.info("page.opend (1)")
                tabSignal.emit("loading.newPage")
            })

            return res.promise();
        }

        /**
         * Показывает анимацию загрузки на экране.
         * @param {promise} promise
         * @returns {undefined}
         */
        spajs.showLoader = function (promise) {
            if (!promise) {
                var def = new jQuery.Deferred();
                def.resolve()
                return def.promise();
            }

            // in-loading
            jQuery("body").addClass("in-loading")
            jQuery.when(promise).then(function () {
                jQuery("body").removeClass("in-loading")
            }).fail(function () {
                // in-loading
                jQuery("body").removeClass("in-loading")
            })

            return promise
        }

        spajs.urlRegExp = function (reg_exp) {
            return function (url) {

                let res = reg_exp.exec(url);
                if (!res) {
                    return false;
                }

                if (res.groups) {
                    return res.groups;
                }

                return res
            }
        }

        //******************************************************************************
        //* Функции для работы с ajax запросами
        //******************************************************************************

        spajs.ajax = function () {
            return this;
        }

        spajs.opt.ajax = {}

        spajs.ajax.headers = {}
        spajs.ajax.setHeader = function (header, data) {
            spajs.ajax.headers[header] = data
        }

        spajs.ajax.showErrors = function (data) {
            if (typeof data === "string") {
                appendNotification(data, "error");
                return;
            }

            if (data && data.responseJSON) {
                return spajs.ajax.showErrors(data.responseJSON)
            }

            if (data && data.message) {
                return spajs.ajax.showErrors(data.message)
            }

            for (var i in data) {
                if (i == "error_type" || i == "result") {
                    continue;
                }

                if (typeof data[i] === "string") {
                    appendNotification(data[i], "error");
                }
                else if (typeof data[i] === "object") {
                    spajs.ajax.showErrors(data[i])
                }
            }
        }
        /**
         * Обрабатывает ошибки присланные аяксом
         * @param {array} data
         * @returns Boolean
         * @private
         */
        spajs.ajax.ErrorTest = function (data) {
            if (data && (data.status === 401 /*|| data.status === 403*/)) {
                window.location.reload()
                return true;
            }
            if (data && data.status === 500) {
                appendNotification("Ошибка 500", "error");
                return true;
            }
            if (data && data.status === 422 && data.responseJSON) {
                spajs.ajax.showErrors(data.responseJSON)
                return true;
            }
            if (data && data.result === false) {
                spajs.ajax.showErrors(data)
                return true;
            }

            if (data && data.error) {
                appendNotification(data.error, "error");
                return true;
            }
            return false;
        }
        /**
         * Вернёт строку из переменных и их значений для добавления к запросу.
         * @returns {String}
         * @private
         */
        spajs.ajax.getPostVars = function () {
            var url = []
            for (var i in spajs.opt.ajax.post) {
                url.push(i + "=" + spajs.opt.ajax.post[i])
            }

            return url.join("&")
        }
        /**
         * Вернёт хеш для переданной строки
         * @param {String} str
         * @returns {Number}
         * @private
         */
        spajs.ajax.gethashCode = function (str) {
            var hash = 0;
            if (!str || str.length == 0) return hash;
            for (var i = 0; i < str.length; i++) {
                hash = ((hash << 5) - hash) + str.charCodeAt(i);
                hash = hash & hash; // Convert to 32bit integer
            }
            return hash;
        }
        /**
         * Вернёт статус сети Online=true
         * @returns {navigator.onLine|window.navigator.onLine|Boolean}
         */
        spajs.isOnline = function () {
            return navigator.onLine
        }
        /**
         * Массив для накопления кеша запросов с ключём useCache
         * @type array
         */
        spajs.ajax.ajaxCache = {}

        /**
         * Массив для накопления очереди запросов на случай если мы ушли в офлайн
         * @type array
         */
        spajs.ajax.ajaxQueue = []

        /**
         * Вспомагательная функция для удаления запроса из очереди запросов
         * @private
         */
        spajs.ajax.Abort = function () {
            spajs.ajax.ajaxQueue[this.IndexInQueue] = undefined
        }

        /**
         * Ключ useCache - включает кеширование запросов для использование если отвалится интернет
         * Ключ reTryInOnline - включает помещение запросов в очередь если нет интернета до тех пор пока интернет не появится.
         * @param {type} opt
         * @returns {Boolean|undefined|jQuery.ajax}
         */
        spajs.ajax.Call = function (opt) {
            /*
             * @note
             * Во первых кеш должен протухать с какой то переодичностью
             * Во вторых он должен учитывать данные авторизации
             */

            if (opt.key === undefined) {
                opt.key = opt.type + "_" + opt.url + "_" + spajs.ajax.gethashCode(JSON.stringify(opt.data))
            }
            if (!spajs.isOnline() && spajs.ajax.ajaxCache[opt.key]) {
                if (opt.error) // Отключил кеширование
                {
                    opt.error();
                }
                //opt.success(spajs.ajax.ajaxCache[opt.key])
                return { useCache: false, addToQueue: false, ignor: false, abort: function () { } };
            }

            if (!spajs.isOnline() && opt.reTryInOnline) {
                opt.abort = spajs.ajax.Abort;
                opt.useCache = false;
                opt.addToQueue = false;
                opt.ignor = true;

                spajs.ajax.ajaxQueue.push(opt)
                return opt;
            }

            if (!spajs.isOnline()) {
                if (opt.error) {
                    opt.error();
                }
                return { useCache: false, addToQueue: false, ignor: true, abort: function () { } };
            }


            var def = opt.def;

            if (!def) {
                def = new jQuery.Deferred();
            }

            var defpromise = def.promise()

            var successCallBack = opt.success
            var errorCallBack = opt.error

            opt.success = function (data, status, xhr) {

                if (data && data.error_unauthorized) {
                    if (opt.useRelogin !== false) {
                        $.when(auth.login(auth.getAuthorizationData().auth)).done(function () {
                            opt.useRelogin = false;
                            opt.def = def
                            spajs.ajax.Call(opt)

                        }).fail(function () {
                            errorCallBack(data, status, xhr)
                            spajs.open({ menuId: "login" });
                        })
                    }

                }


                if (opt.useCache) {
                    //spajs.ajax.ajaxCache[opt.key] = data  // Отключил кеширование
                }
                if (successCallBack) successCallBack(data, status, xhr)
                def.resolve(data, status, xhr)
            }

            opt.error = function (data, status, xhr) {
                var headers = data.getAllResponseHeaders()
                if (data.status == 401 || (data.status == 403 && headers.indexOf("x-anonymous:") != -1)) {
                    window.location.reload()
                }
                else if (errorCallBack) {
                    errorCallBack(data, status, xhr)
                    def.reject(data, status, xhr)
                }
                else {
                    def.reject(data, status, xhr)
                }
            }

            if (!opt.beforeSend) {
                opt.beforeSend = function (xhr) {
                    for (var i in spajs.ajax.headers) {
                        xhr.setRequestHeader(i, spajs.ajax.headers[i]);
                    }
                }
            }

            // opt.url = this.getAjaxURL(opt.url);

            var res = jQuery.ajax(opt);
            res.useCache = false;
            res.addToQueue = false;
            res.ignor = false;

            defpromise.abort = function () {
                res.abort()
            }

            return defpromise
        }

        spajs.ajax.ajaxCallFromQueue = function () {
            for (var i in spajs.ajax.ajaxQueue) {
                jQuery.ajax(spajs.ajax.ajaxQueue[i]);
            }
            spajs.ajax.ajaxQueue = []
        }

        return this;
    }
}

if (!window.spajs) {
    window.spajs = new SpaJs("spa_")
}


appQuery = {
}

appQuery.opt = {}

appQuery.headers = {}
appQuery.queue = []

appQuery.setHeader = function (header, data) {
    this.headers[header] = data
}


appQuery.ajaxCallFromQueue = function () {

}

/**
 * @param {Object} opt
 * @returns {jQuery.ajax}
 */
appQuery.ajax = function (opt) {
    var thisObj = this;
    var def = new jQuery.Deferred();


    if (opt.optimist && opt.optimist.key) {
        $.when(optimist.get(opt.optimist.key)).done(function (data) {
            if (opt.optimist.success) opt.optimist.success(data)
        }).fail(function () {
            if (opt.optimist.error) opt.optimist.error()
        })
    }

    if (!opt.beforeSend) {
        opt.beforeSend = function (xhr) {
            for (var i in thisObj.headers) {
                xhr.setRequestHeader(i, thisObj.headers[i]);
            }
        }
    }

    var res = jQuery.ajax(opt);

    $.when(res).done(function (data) {
        if (!opt || !opt.optimist || !opt.optimist.key) {
            return;
        }
        // Круто надо сохранить ответ на будущие
        optimist.set(opt.optimist.key, data)
    }).fail(function () {
        // Ошибочка надо бы проверить статус ошибки и поставить запрос в очередь
    })
    return res
}

optimist = {
    get: function (key) {
        var def = new jQuery.Deferred();
        var data = window.localStorage['optimist_' + key];
        if (!data) {
            def.reject()
        }
        else {
            try {
                data = JSON.parse(data);
                if (data.time) {
                    // @todo тут проверить если время истекло то удалить элемент
                    //window.localStorage.removeItem('appQuery_'+opt.optimist.key)
                }
                def.resolve(data.data)
            } catch (e) {
                window.localStorage.removeItem('optimist_' + key)
                def.reject()
            }
        }
        return def.promise();
    },
    set: function (key, data) {
        window.localStorage['optimist_' + key] = JSON.stringify({ data: data, time: 0 })
    },
}

function setSpaPageType(type) {
    if (window.__lastSpaPageType && window.__lastSpaPageType != type) {
        setTimeout(() => {
            window.location.reload();
        }, 50)
    }

    window.__lastSpaPageType = type
}

// debugger

$(document).ready(function(){
    window.spajs.init({
        holder: "#spa-page-content",
        useHistoryApi: true,
    });
});


window.tabSignal.on("page.loaded", () => {
    window.spajs.linkInit();
});