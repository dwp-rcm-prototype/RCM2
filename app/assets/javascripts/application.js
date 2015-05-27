(function () {
    "use strict";

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        };
    }

    var rcm,
        ValidationObject = {

            settings: {
                form: '',
                submitButton: '',
                inputFields: ['input[type="text"]', 'input[type="number"]', 'input[type="tel"]', 'input[type="email"]', 'input[type="checkbox"]', 'input[type="radio"]', 'select', 'textarea'],
                allFields: '',
                validationMessage: '',
                errorCount: 0,
                errorMessages: '',
                threeStrikesCount: 0,
                submitErrorMessage: 'There\'s been an error talking to the server. Please wait a moment and try again.',
                messageTemplate :   '<div class="error-summary" id="error-summary" role="alert" tabindex="-1" aria-labelledby="error-summary-heading">' +
                                        '<h2 class="heading-medium error-summary-heading" id="error-summary-heading">' +
                                            'Unable to submit the form.' +
                                        '</h2>' +
                                        '<p>[customMessage]</p>' +
                                        '[errorMessages]' +
                                    '</div>',
                formErrorMessages: [],
                formErrorMessage: ''
            },

            init: function (formClassName) {
                rcm = this.settings;
                rcm.submitButton = 'form.' + formClassName + ' input[type="submit"]';
                this.disableHTML5validation(formClassName);
                this.bindUIActions();

                // load the form validation error messages
                $.getScript('/public/javascripts/formValidationMessages.js', function(data){
                    rcm.formErrorMessages = initFormErrorMessages();
                });

                var i = 0;
                $('form.' + formClassName).each(function() {
                    $(this).find('.validation-group').each(function() {
                        $(this).attr('id', 'validation-group--' + i);
                        i += 1;
                    });
                });
            },

            reset: function () {
                rcm.errorCount = 0;
                rcm.errorMessages = '';
                $(rcm.form).removeClass('invalid').parent().find('div.error-summary').remove();
                // remove all valids and invalids?
            },

            bindUIActions: function () {
                $(rcm.submitButton).on("click", function (e) {
                    //e.preventDefault();
                    rcm.form = $(this).parents('form');
                    ValidationObject.validateForm(e);
                });

                // toggle-controlled is a class that should only work to hide information when javascript is enabled
                $('.toggle-controlled').hide();
                $('.display-block-js').show();


                // generic toggle functionality
                $('.toggle-control input[type="radio"]').on('click', function () {
                    var sections = $(this).parents('.toggle-control').attr('data-toggle-target'),
                        sectionOn = $(this).parents('.toggle-control').attr('data-toggle-target') + '__' + $(this).val().toLowerCase();
                    $('.' + sections).hide();
                    $('.' + sectionOn).show();
                });

            },

            disableHTML5validation: function (formClassName) {
                // disable html5 form checking (if we have js)
                if (!$('html').hasClass('lte-ie8')) { // we can't have attr('novalidate) for IE7 - see https://www.google.co.uk/search?q=jquery%20ie7%20member%20not%20found - but this line is not required for IE8 and less anyway.
                    $('form.' + formClassName).attr('novalidate', 'novalidate').find('input[type="number"], input[type="tel"], input[type="email"]').each(function () {
                        $(this).attr('type', 'text');
                    });
                }
            },


            displayMessageAndBlockSubmit: function (e, message) {
                e.preventDefault();
                $('h1').prepend(message);
                $("html, body").animate({scrollTop:$('#error-summary').position().top}, '500', 'swing');
                //$("html, body").animate({scrollTop:$('h1').position().top}, '500', 'swing');
                $('#error-summary').focus();
            },

            fieldValid: function (el) {
                if (!$(el).is(':visible')) {
                    return null;
                }

                var inputType = (el.tagName.toLowerCase() === 'textarea') ? 'textarea' : $(el).attr('type');

                switch (inputType) {
                    case 'radio':
                    case 'checkbox':
                        return (el.checked) ? el.name : null;
                    case 'text':
                    case 'number':
                    case 'email':
                    case 'tel':
                    case 'textarea':
                        var regexObj, result, tooltip, defaultTooltip,
                            value = el.value,
                            pattern = $(el).attr('data-pattern');

                        pattern = (pattern != null) ? pattern : $(el).attr('pattern');

                        if (pattern == null) {
                            return (value !== '') ? el.name : null;
                        } else {

                            /*if ($(el).next('p.sticky').get(0) != null) {
                             defaultTooltip = $(el).next('p.sticky').attr('data-default-text');
                             $(el).removeClass('invalid').next('p.sticky').html(defaultTooltip);
                             } else {
                             $(el).removeClass('invalid').next('p.form-hint.display-block').remove();
                             }*/
                            $(el).removeClass('invalid').parent().find('.error-message').remove();

                            regexObj = new RegExp(pattern, "gi");
                            result = regexObj.test(value);
                            if (result) {
                                return el.name;
                            } else {
                                if ($(el).val() !== '') {

                                    tooltip = $(el).attr('data-field-error');
                                    if (tooltip != null) {
                                        if ($(el).prev('label') !== null) {
                                            $(el).addClass('invalid').prev('label').append('<span class="error-message">' + tooltip + '</span>');
                                        } else {
                                            $(el).addClass('invalid').parent().find('label').append('<span class="error-message">' + tooltip + '</span>');
                                        }
                                        //}
                                    } else {
                                        $(el).addClass('invalid');
                                    }
                                }
                                return null;
                            }
                        }
                        break;
                    default:
                        return null;

                }
            },

            invalidateElement: function (el) {
                var id = $(el).attr('id');
                if (id === null) { id = $(el).parents('.validation-group').attr('id')};
                $(el).addClass('invalid');

                // NOTE TO SELF: Change the anchor to a jQuery animation
                rcm.errorMessages += '<li><a href="#' + id + '">' + rcm.validationMessage + '</a></li>';
                rcm.errorCount += 1;
            },

            validateGroups:function(e) {
                var groupsOK  = true;
                $(rcm.form).find('.validation-group').removeClass('invalid valid').each(function () {
                    if (!ValidationObject.validateGroup(this)) {
                        groupsOK = false;
                    };
                });
                return groupsOK;
            },

            validateGroup: function (el) {

                var groupOK = true;
                if ($(el).is(':visible')) {

                    rcm.validationMessage = $(el).attr('data-validation-message');

                    var fields, setOK, setsOK, sets,
                        validationType = $(el).attr('data-validation-type'),
                        typesToCheck = ['required--one-or-more', 'required--one', 'required--all', 'optional--one-or-more', 'optional--one'],
                        fieldsWithValidValue = [],
                        allFields = [];


                    if (typesToCheck.indexOf(validationType) !== -1) {
                        fieldsWithValidValue = $.unique($(el).find(rcm.inputFields.join(',')).map(function () {
                            return ValidationObject.fieldValid(this);
                        }).get());
                    }

                    switch (validationType) {
                        // it's not required, so don't display error messages. But when there is valid data, mark it as such
                        case 'optional--one-or-more':
                        case 'optional--one':
                            if (fieldsWithValidValue.length > 0) {
                                $(el).addClass('valid');
                            }
                            break;
                        case 'required--one-or-more':
                        case 'required--one':
                            if (fieldsWithValidValue.length === 0) {
                                ValidationObject.invalidateElement(el);
                                groupOK = false;
                            } else {
                                $(el).addClass('valid');
                            }
                            break;

                        case 'required--all':
                            allFields = $.unique($(el).find(rcm.inputFields.join(',')).map(function () {
                                return this.name;
                            }).get());

                            if (allFields.length > fieldsWithValidValue.length) {
                                ValidationObject.invalidateElement(el);
                                groupOK = false;
                            } else {
                                $(el).addClass('valid');
                            }
                            break;

                        case 'required--set':

                            setsOK = false;
                            sets = $(el).attr('data-validation-sets').split('|');

                            for (var s = 0, sl = sets.length; s < sl; s += 1) {

                                fields = sets[s].split(',');
                                setOK = true;
                                for (var f = 0, fl = fields.length; f < fl; f += 1) {
                                    if (!ValidationObject.fieldValid($(el).find('input[name="' + fields[f] + '"]').get(0))) {
                                        setOK = false;
                                        //don't break - keep checking the fields
                                    }
                                }
                                if (setOK) {
                                    setsOK = true;
                                    $(el).addClass('valid');
                                    break;
                                }
                            }
                            if (!setsOK) {
                                ValidationObject.invalidateElement(el);
                                groupOK = false;
                            }
                            break;
                        default:
                            // nothing
                            break;
                    }
                }

                return groupOK;
            },




            validateFormSets: function (e) { // Called by validateForm. Checks if the form requirements (sets) have been met


                var groups, groupOK, setsOK, sets, formValidationType,
                    formErrorMessages = [];

                // Load the messages:



                formValidationType = $(rcm.form).attr('data-form-validation-type');

                if (formValidationType !== null && formValidationType !== '') {
                    switch (formValidationType) {
                        case 'required--set':
                            setsOK = false;
                            sets = $(rcm.form).attr('data-form-validation-sets').split('|');

                            for (var s = 0, sl = sets.length; s < sl; s += 1) {
                                groups = sets[s].split(',');
                                groupOK = true;

                                for (var f = 0, fl = groups.length; f < fl; f += 1) {
                                    if (!$('[data-form-validation-id="' + groups[f] + '"]').hasClass('valid')) {
                                        groupOK = false;
                                        break;
                                    }
                                }
                                if (groupOK) {
                                    setsOK = true;
                                    break;
                                }
                            }
                            if (!setsOK) {
                                return false; // tell the function validateForm that this test failed
                            }

                            break;
                    }
                }
                return true; // tell the function validateForm that this test passed
            },

            getFormData: function() {
                var jsonData = {},
                    varName,
                    varValue,
                    el,
                    inSub = false,
                    subName = '',
                    formID = $(rcm.form).attr('id');
                jsonData[formID] = {};
                var values = jsonData[formID];

                for (var i = 0, il = document.forms[formID].elements.length; i < il; i += 1) {
                    el = document.forms[formID].elements[i];
                    varName = el.name;
                    varValue = el.value;

                    if (inSub && varName.indexOf(subName + '--') !== 0) {
                        inSub = false;
                        subName = '';
                    }

                    if (varName !== '' && ['INPUT', 'TEXTAREA'].indexOf(el.tagName) !== -1) {

                        switch(el.type) {
                            case 'radio':
                                if (el.checked) {
                                    if (inSub) {
                                        values[subName + '--data'][varName] = varValue;
                                    } else {
                                        values[varName] = varValue;
                                    }
                                }
                                break;
                            default:
                                if (inSub) {
                                    values[subName + '--data'][varName] = varValue;
                                } else {
                                    values[varName] = varValue;
                                }
                                break;
                        }
                    }

                    if (varName.indexOf('helper--') === 0) {
                        // we're diving into a subgroup
                        inSub = true;
                        subName = varName.replace('helper--', '');
                        values[subName + '--data'] = {};

                    }
                }
                return jsonData;
            },

            getFullFormData: function() {
                return ValidationObject.getFormData(); // getSavedFormData(); // a whole lot of data
            },

            postProcessor: function (e) {
                var selected;

                switch ($(rcm.form).attr('id')) {
                    case 'form__fraud-type' : // redirect based on user input

                        var partnerSelected,
                            partnerOptions = ['livingWithPartner'];

                        // reset the route cookie
                        docCookies.removeItem('fraud-type');

                        selected = $(rcm.form).find('input[type="checkbox"][name="fraud-type"]:checked').map(function () {
                            return this.value;
                        }).get();
                        // store the choices in a cookie
                        docCookies.setItem('fraud-type', selected.join('+'));

                        partnerSelected = $.grep(selected, function (n) {
                            return (partnerOptions.indexOf(n) !== -1);
                        });

                        if (partnerSelected.length === 0) {
                            e.preventDefault();
                            document.location.href = '/rcm/employment-suspect';
                        }
                        break;

                    case 'form__employment-prompt': // redirect based on user input


                        e.preventDefault();

                        selected = $(rcm.form).find('input[type="checkbox"][name="employment"]:checked').map(function () {
                            return this.value;
                        }).get();

                        if (selected.length === 2) {
                            document.location.href = '/rcm/employment-suspect-then-partner';
                        } else if (selected.indexOf('Suspect') === 0) {
                            document.location.href = '/rcm/employment-suspect';
                        } else if (selected.indexOf('Partner') === 0) {
                            document.location.href = '/rcm/employment-partner';
                        }

                        break;

                    case 'form__other-information':
                        /* final submit
                        1. collect data; form JSON
                        2. Use Ajax to submit data
                        3. if result = ok: proceed
                        4. if false: display error message & try again
                        */
                        e.preventDefault();

                        var formData = {
                                "caller": "RCM",
                                "timestamp": Date(),
                                "values": ValidationObject.getFullFormData()
                            };

                        $('#submit-cover').show();

                        // NB had to install this plugin: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en-US
                        $.ajax({
                            type: "POST",
                            url: "https://alphagov-rcmfrontend.herokuapp.com/submitEvidence",
                            dataType: 'text',
                            data: JSON.stringify(formData),
                            crossDomain: true
                        }).done(function(returnData) {
                            $('#submit-cover .clock').remove();
                            document.location.href = document.forms[0].action;

                        }).fail(function() {
                            e.preventDefault();
                            $('#submit-cover').hide();
                            ValidationObject.displayMessageAndBlockSubmit(e, rcm.messageTemplate.replace('<p>[customMessage]</p>', '').replace('[errorMessages]', rcm.submitErrorMessage));
                        });

                        return false;
                        break;
                }
            },



            storeData: function () {

                /*
                1. check local storage (user session storage) or cookie
                2. collect data from form (see submit fxy). If cookie, check max size
                3. Store in LS or cookie.
                 */
                var storageType = (hasLocalStorage()) ? 'LocalStorage' : ((document.body.addBehavior) ? 'UserData' : 'Cookie');
                var formJSON = ValidationObject.getFormData();
                //console.log(formJSON);

            },

            validateForm: function (e) {

                //e.preventDefault();

                // initialise the validation object
                ValidationObject.reset();

                // 1, Validate the validation groups
                if (!ValidationObject.validateGroups()) {

                    var message = rcm.messageTemplate.replace('[customMessage]', 'Please check the following problem or problems').replace('[errorMessages]', '<ul class="list-bullet error-summary-list">' + rcm.errorMessages + '</ul>');
                    ValidationObject.displayMessageAndBlockSubmit(e, message);

                    e.preventDefault();
                    return;
                }

                // 2. Validate the form sets
                if (!ValidationObject.validateFormSets()) {

                    var messageIdentifier = $(rcm.form).attr('data-form-validation-message').replace('$message--', '');
                    var formErrorMessage = rcm.formErrorMessages[messageIdentifier];

                    rcm.threeStrikesCount += 1;
                    if (rcm.threeStrikesCount >= 3) {
                        formErrorMessage = (rcm.formErrorMessages[messageIdentifier + '__3strikes'] === null) ? formErrorMessage : rcm.formErrorMessages[messageIdentifier + '__3strikes'];
                    }
                    $(rcm.form).addClass('invalid');
                    ValidationObject.displayMessageAndBlockSubmit(e, rcm.messageTemplate.replace('<p>[customMessage]</p>', '').replace('[errorMessages]', formErrorMessage));

                    return;
                }

                // 3. store data client-side
                ValidationObject.storeData(); // cookies only last a session

                // 4. anything else?
                ValidationObject.postProcessor(e);

            }

        };

    var pageSetup = function () {

        $('a.previousPage').on('click', function (e) {
            e.preventDefault();
            window.history.back();
        });

        // implement how user choices affect their journey
        // SHOULD THIS BE IN PAGESETUP?? DEFINITELY IN OWN FUNCTION

        var myRoute = docCookies.getItem('fraud-type');

        if (myRoute !== null && myRoute !== '') {
            var cpIndex, newPage,
                routes = [],
                currentPage = document.location.href.replace();

            routes['workEarning'] = ['type-of-fraud', 'employment-suspect', 'other-information', 'complete'];
            routes['livingWithPartner'] = ['type-of-fraud', 'identify-partner', 'other-information', 'complete'];
            routes['workEarning+livingWithPartner'] = ['type-of-fraud', 'identify-partner', 'employment-prompt', 'other-information', 'complete'];

            currentPage = currentPage.substr(currentPage.lastIndexOf('/') + 1);
            currentPage = (currentPage.indexOf('#') === -1) ? currentPage : currentPage.substr(0, currentPage.indexOf('#'));

            cpIndex = routes[myRoute].indexOf(currentPage);
            newPage = routes[myRoute][cpIndex + 1];

            $('form.js-routed').each(function() {
                $(this).attr('action', newPage + '/');
            });


        }

    };

    var hasLocalStorage = function () {
        try {
            localStorage.setItem('x', 'x');
            localStorage.removeItem('x');
            return true;
        } catch(e) {
            return false;
        }
    };

    $(document).ready(function () {
        pageSetup();
        ValidationObject.init('js-check');
    });


})();


/*




 */