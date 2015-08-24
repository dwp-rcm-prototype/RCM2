(function () {
    "use strict";

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function (obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        };
    };

    Array.prototype.fraudTypeSelected = function(value) {
        //value = (value.isArray()) ? value : [value];
        var result = $.grep(this, function (n) {return ([value].indexOf(n) !== -1);});
        return (result.length === 0) ? false : true;
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

    var rcm,
        ValidationObject = {

            settings: {
                form: '',
                submitButton: '',
                inputFields: ['input[type="text"]', 'input[type="number"]', 'input[type="tel"]', 'input[type="email"]', 'input[type="checkbox"]', 'input[type="radio"]', 'select', 'textarea'],
                checkBoxes: ['input[type="checkbox"]:checked'],
                allFields: '',
                checkBoxFields: '',
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
                formErrorMessage: '',
                localStorage: hasLocalStorage(),
                userDataStorage: document.body.addBehavior,
                userDataObj: {}
        },

        init: function () {

            rcm = this.settings;
            rcm.form = $('form.js-check');
            rcm.formID = rcm.form.attr('id');
            rcm.submitButton = $('form#' + rcm.formID + ' input#submit');

            this.disableHTML5validation();
            this.bindUIActions();

            // load the form validation error messages
            $.getScript('/public/javascripts/formValidationMessages.js', function(data){
                rcm.formErrorMessages = initFormErrorMessages();
            });

            var i = 0;
            rcm.form.find('.validation-group').each(function() {
                $(this).attr('id', 'validation-group--' + i);
                i += 1;
            });


            if (!rcm.localStorage && rcm.userDataStorage) {
                rcm.userDataObj = document.getElementById('IEuserData');
                if (rcm.userDataObj) {
                    rcm.userDataObj.load('rcmData');
                }

            }

            if(rcm.formID === 'form__review') {
                var reviewHtml,
                    typeHTML = '',
                    suspect,
                    formJSON = ValidationObject.getSavedFormData(null);

                if (formJSON['form__identify-suspect']) {
                    suspect = formJSON['form__identify-suspect']['name'];

                    reviewHtml = '<p>You\'re saying that ' + ((suspect === ' ') ? 'the suspect' : '<strong>' + suspect + '</strong>') + ' </p>';

                    if (formJSON['form__fraud-type']['fraud-type']['livingAbroad'] != false) {
                        typeHTML += '<li>is claiming whilst living abroad</li> ';
                    };
                    if (formJSON['form__fraud-type']['fraud-type']['disabilityCarers'] != false) {
                        typeHTML += '<li>is dishonestly claiming disability benefits</li> ';
                    };
                    if (formJSON['form__fraud-type']['fraud-type']['identityFraud'] != false) {
                        typeHTML += '<li>is committing identity fraud</li> ';
                    };
                    if (formJSON['form__fraud-type']['fraud-type']['workEarning'] != false) {
                        typeHTML += '<li>is not reporting the money they earn</li> ';
                    };
                    if (formJSON['form__fraud-type']['fraud-type']['undeclaredIncome'] != false) {
                        typeHTML += '<li>has undeclared other income or savings</li> ';
                    };
                    if (formJSON['form__fraud-type']['fraud-type']['livingWithPartner'] != false) {
                        typeHTML += '<li>is living with a partner but saying they live alone</li> ';
                    };
                    /*if (formJSON['form__fraud-type']['fraud-type']['unsure'] != false) {
                        typeHTML = '';
                    };
*/
                    if (typeHTML !== '') {
                        reviewHtml += '<ol class="list-bullet">' + typeHTML + '</ol>';
                        if (formJSON['form__other-information']['additional-information'] !== '') {
                            reviewHtml += 'Additional information:<br>' + formJSON['form__other-information']['additional-information'] + '<br><br>';
                        }
                    } else {
                        if ((formJSON['form__other-information']['additional-information'] !== '') && (formJSON['form__fraud-type']['fraud-type']['unsure'] != false)) {
                            reviewHtml += 'Additional information:<br>' + formJSON['form__other-information']['additional-information'] + '<br><br>';
                        } else {
                            reviewHtml = 'You haven\'t identified any fraudulent activities. ';
                        }
                    }
                    reviewHtml += 'If you want you can click \'back\' and review your answers.';

                } else {
                    reviewHtml = '<strong>We\'re really sorry but something seems to have go wrong.</strong><br>' +
                                'Please <a href="/rcm">return to the first page</a> and fill in any missing information.';
                }
                document.getElementById('review-text').innerHTML = reviewHtml;
            }
        },

        reset: function () {
            rcm.errorCount = 0;
            rcm.errorMessages = '';
            $(rcm.form).removeClass('invalid').parent().find('div.error-summary').remove();
            // remove all valids and invalids?
        },

        bindUIActions: function () {

            rcm.submitButton.on("click", function (e) {
                //e.preventDefault();
                ValidationObject.validateForm(e);
            });

            // toggle-controlled is a class that should only work to hide information when javascript is enabled
            $('.toggle-controlled').hide();
            $('.display-block-js').show();

            $('.button-get-started, .clear-data').on('click', function() {
                ValidationObject.clearData();
            });


            // generic toggle functionality
            $('.toggle-control input[type="radio"]').on('click', function () {
                var sections = $(this).parents('.toggle-control').attr('data-toggle-target'),
                    sectionOn = $(this).parents('.toggle-control').attr('data-toggle-target') + '__' + $(this).val().toLowerCase(),
                    sectionFocus = ($(this).hasClass('toggle--focus')) ? true : false;
                $('.' + sections).hide();
                if (sectionFocus) {
                    $('.' + sectionOn).show().focus().blur(); // focus but then remove the blue box
                } else {
                    $('.' + sectionOn).show();
                }
            });
        },

        disableHTML5validation: function () {
            // disable html5 form checking (if we have js)
            if (!$('html').hasClass('lte-ie8')) { // we can't have attr('novalidate) for IE7 - see https://www.google.co.uk/search?q=jquery%20ie7%20member%20not%20found - but this line is not required for IE8 and less anyway.
                rcm.form.attr('novalidate', 'novalidate').find('input[type="number"], input[type="tel"], input[type="email"]').each(function () {
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

            $('#error-summary a').click(function(e){
                $(this).blur();
                e.preventDefault();
                var target = $(this).attr('href');
                target = target.substr(target.indexOf('#'), target.length); // remove the whole path if included (e.g. in IE6)
                $('html, body').animate({
                    scrollTop: $(target).offset().top
                }, 500);
            });
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
//                            return (value !== '') ? el.name : null;
                        if (value !== '') {
                            $(el).removeClass('empty');
                            return el.name;
                        } else {
                            $(el).addClass('empty');
                            return null;
                        }
                    } else {

                        $(el).removeClass('invalid empty').parent().find('.error-message').remove();

                        regexObj = new RegExp(pattern, "gi");
                        result = regexObj.test(value);
                        if (result) {
                            return el.name;
                        } else {
                            if ($(el).val() === '') {
                                $(el).addClass('empty');
                            } else {
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

            rcm.errorMessages += '<li><a href="#' + id + '">' + rcm.validationMessage + '</a></li>';
            rcm.errorCount += 1;
        },

        validateGroups:function(e) {
            var groupsOK  = true;
            $(rcm.form).find('.validation-group').removeClass('invalid valid').each(function () {
                if (!ValidationObject.validateGroup(this)) {
                    groupsOK = false;
                }
            });
            return groupsOK;
        },

        validateGroup: function (el) {

            var groupOK = true;
            if ($(el).is(':visible')) {

                rcm.validationMessage = $(el).attr('data-validation-message');

                var fields, setOK, setsOK, sets,
                    validationType = $(el).attr('data-validation-type'),
                    typesToCheck = ['required--one-or-more', 'required--one', 'required--valid-or-empty', 'required--all', 'optional--one-or-more', 'optional--one'],
                    fieldsWithValidValue = [],
                    allFields = [],
                    checkBoxFields = [];


                if (typesToCheck.indexOf(validationType) !== -1) {
                    fieldsWithValidValue = $.unique($(el).find(rcm.inputFields.join(',')).map(function () {
                        return ValidationObject.fieldValid(this); // RE: What if a field is required but doesn't have a pattern. It should show red, but does it?
                    }).get());
                }
                if ($('body').find('#form__details').length) {
                    checkBoxFields = $.unique($(el).find(rcm.checkBoxes.join(',')).map(function () {
                      return $(this).val();
                  }).get());
                  fieldsWithValidValue = checkBoxFields;
                  for (var i = 0, l = fieldsWithValidValue.length; i < l; i++) {
                    $('#' + fieldsWithValidValue[i]).addClass('valid');
                  }
                };

                switch (validationType) {
                    // it's not required, so don't display error messages. But when there is valid data, mark it as such
                    case 'optional--one-or-more':
                    case 'optional--one':
                        if (fieldsWithValidValue.length > 0) {
                            $(el).addClass('valid');
                        }
                        break;
                    case 'required--valid-or-empty':
                        if (fieldsWithValidValue.length === 0 && $(el).find('input').val() !== '') {
                            ValidationObject.invalidateElement(el);
                            groupOK = false;
                        } else {
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

        getFormData: function(fromLocalStorage) {

            var formData, jsonData, elName, elValue, target, el, inSub, subName, inSubSub, subSubName, formID, values;

            inSub = false;
            subName = '';
            inSubSub = false;
            subSubName = '';
            formID = rcm.formID;

            formData = (fromLocalStorage === true) ? false: true;
            jsonData = (formData) ? {} : ValidationObject.getSavedFormData(formID);

            if (formData) {
                jsonData[formID] = {};
                values = jsonData[formID];
            }

            if ((!formData && jsonData[formID]) || formData) { //

                for (var i = 0, il = document.forms[formID].elements.length; i < il; i += 1) {

                    el = document.forms[formID].elements[i];
                    elName = (el.name === null || el.name === '' || el.name === undefined) ? null : el.name;

                    if (elName !== null) {

                        if (inSubSub && elName.indexOf(subSubName + '--') !== 0) {
                            inSubSub = false;
                            subSubName = '';
                        }
                        if (inSub && (elName.indexOf(subName + '--') !== 0 && elName.indexOf('helper--' + subName + '--') !== 0)) {
                            inSub = false;
                            subName = '';
                        }

                        if (formData) {
                            elValue = el.value;
                        } else {
                            if (inSubSub) {
                                elValue = jsonData[formID][subName + '--data'][subSubName + '--data'][elName];
                            } else if (inSub) {
                                elValue = jsonData[formID][subName + '--data'][elName];
                            } else {
                                elValue = jsonData[formID][elName];
                            }
                        }

                        if (elName !== '' && ['INPUT', 'TEXTAREA'].indexOf(el.tagName) !== -1) {

                            if (formData) {
                                target = (inSubSub) ? values[subName + '--data'][subSubName + '--data'] : ((inSub) ? values[subName + '--data'] : values);
                            }

                            switch (el.type) {
                                case 'radio':
                                    if (formData) {
                                        if (el.checked) {
                                            target[elName] = elValue;
                                        }
                                    } else {
                                        if (el.value === elValue) {
                                            $(el).trigger('click');
                                        }
                                    }
                                    break;
                                case 'checkbox':
                                    if (formData) {
                                        if (el.checked) {
                                            if (target[elName] != null) {
                                                target[elName][target[elName].length] = elValue;
                                            } else {
                                                target[elName] = [];
                                                target[elName][0] = elValue;
                                            }
                                        }
                                    } else {
                                       if (elValue.indexOf(el.value) !== -1) {
                                            el.checked = true;
                                        }
                                    }
                                    break;
                                default:
                                    if (formData) {
                                        target[elName] = elValue;
                                    } else {
                                        el.value = elValue;
                                    }
                                    break;
                            }
                        }
                    }

                    if (elName !== null && elName.indexOf('helper--') === 0) {

                        if (inSub) {
                            inSubSub = true;
                            subSubName = elName.replace('helper--', '');
                            if (formData) {
                                values[subName + '--data'][subSubName + '--data'] = {};
                            }
                        } else {
                            inSub = true;
                            subName = elName.replace('helper--', '');
                            if (formData) {
                                values[subName + '--data'] = {};
                            }
                        }
                    }
                }
            }

            if (formData) {
                return jsonData;
            }
        },

        getSavedFormData: function(formID) {

            var tmpJSON, tmpValue,
                formJSON = {},
                formIDsString = (formID === null) ? ValidationObject.storageGetItem('formIDs') : formID,
                formIDs;

            if (formIDsString != null) {
                formIDs = formIDsString.split(',');


                for (var i = 0, il = formIDs.length; i < il; i += 1) {
                    tmpValue = ValidationObject.storageGetItem(formIDs[i]);

                    if (tmpValue !== null) {
                        tmpJSON = JSON.parse(tmpValue);
                        formJSON[formIDs[i]] = tmpJSON[formIDs[i]];
                    }
                }
            }
            return formJSON;
        },

        postProcessor: function (e) {
            var selected;

            switch (rcm.formID) {

                case 'form__fraud-type' : // redirect based on user input

                    // reset the route cookie
                    ValidationObject.storageRemoveItem('fraud-type');

                    selected = $(rcm.form).find('input[type="checkbox"][name="fraud-type"]:checked').map(function () {
                        return this.value;
                    }).get();
                    // store the choices in a cookie
                    ValidationObject.storageSetItem('fraud-type', selected.join('+'));

                    if (!selected.fraudTypeSelected('livingWithPartner')) {  // Identify partner is the default page
                        e.preventDefault(); // if not, then do a manual redirect
                        if (selected.fraudTypeSelected('workEarning')) {
                            document.location.href = '/rcm/employment-suspect';
                        } else if (selected.fraudTypeSelected('disabilityCarers')) {
                            document.location.href = '/rcm/disability-or-carers-benefit';
                        } else if (selected.fraudTypeSelected('livingAbroad')) {
                            document.location.href = '/rcm/living-abroad';
                        } else if (selected.fraudTypeSelected('identityFraud')) {
                            document.location.href = '/rcm/identity-fraud';
                        } else if (selected.fraudTypeSelected('undeclaredIncome')) {
                            document.location.href = '/rcm/undeclared-income';
                        } else if (selected.fraudTypeSelected('unsure')) {
                            document.location.href = '/rcm/other-information';
                        }
                    }
                    break;

                case 'form__employment-prompt': // redirect based on user input


                    e.preventDefault();

                    selected = $(rcm.form).find('input[type="checkbox"][name="employment"]:checked').map(function () {
                        return this.value;
                    }).get();

                    if (selected.length === 2) {
                        ValidationObject.storageSetItem('employment', 'suspect+partner');
                        document.location.href = '/rcm/employment-suspect-then-partner';
                    } else if (selected.indexOf('Suspect') === 0) {
                        ValidationObject.storageSetItem('employment', 'suspect');
                        document.location.href = '/rcm/employment-suspect';
                    } else if (selected.indexOf('Partner') === 0) {
                        ValidationObject.storageSetItem('employment', 'partner');
                        document.location.href = '/rcm/employment-partner';
                    }

                    break;

                case 'form__review':
                    /* final submit
                    1. collect data; form JSON
                    2. Use Ajax to submit data
                    3. if result = ok: proceed
                    4. if false: display error message & try again
                    */

                    e.preventDefault();

                    var formData,
                        ms,
                        time = new Date(),
                        formJSON = ValidationObject.getSavedFormData(null);

                    formData = {
                        "caller": "RCM",
                        "timestamp": Date(),
                        "values": formJSON
                    };

                    ms = time.getTime();

                    $('#submit-cover').show();
                    //console.log('Submitting data. formData = ');
                    //console.log(JSON.stringify(formData));

                    // NB install this plugin if you need to post directly to a different domain/ port: https://chrome.google.com/webstore/detail/allow-control-allow-origi/nlfbmbojpeacfghkpbjhddihlkkiljbi?hl=en-US
                    $.support.cors = true; // for IE7
                    $.ajax({
                        type: "POST",
                        url: "/submitEvidence",
                        dataType: 'text',
                        data: JSON.stringify(formData),
                        crossDomain: true
                    }).done(function(returnData) {
                        if (returnData !== 'Error connecting to server: Error: getaddrinfo ENOTFOUND') {
                            ValidationObject.clearData();
                            time = new Date();
                            ms = time.getTime() - ms;
                            // make sure that at least 2 seconds pass so that it looks like the system really has been busy
                            setTimeout(function () {
                                $('#submit-cover .clock').remove();
                                document.location.href = document.forms[rcm.formID].action;
                            }, 500 - ms);
                        } else {

                            $('#submit-cover').hide();
                            ValidationObject.displayMessageAndBlockSubmit(e, rcm.messageTemplate.replace('<p>[customMessage]</p>', '').replace('[errorMessages]', rcm.submitErrorMessage));
                        }
                    }).fail(function(jqXHR, textStatus, errorThrown) {

                        $('#submit-cover').hide();
                        ValidationObject.displayMessageAndBlockSubmit(e, rcm.messageTemplate.replace('<p>[customMessage]</p>', '').replace('[errorMessages]', rcm.submitErrorMessage));
                    });

                    return false;
                    break;
            }
        },

        storageRemoveItem: function (key) {
            if (rcm.localStorage) {
                sessionStorage.removeItem(key);
            } else if (rcm.userDataStorage) {

                var timestamp = new Date(); // set the data to expire in an hour
                timestamp.setMinutes(timestamp.getMinutes() + 60);
                var expirationDate = timestamp.toUTCString();
                rcm.userDataObj.expires = expirationDate;

                rcm.userDataObj.removeAttribute(key);
                rcm.userDataObj.save('rcmData');

             }
        },

        storageSetItem: function (key, value) {
            if (rcm.localStorage) {
                sessionStorage.setItem(key, value);
            } else if (rcm.userDataStorage) {


                var timestamp = new Date(); // set the data to expire in an hour
                timestamp.setMinutes(timestamp.getMinutes() + 60);
                var expirationDate = timestamp.toUTCString();
                rcm.userDataObj.expires = expirationDate;

                rcm.userDataObj.setAttribute(key, value);
                rcm.userDataObj.save('rcmData');

            }
        },

        storageGetItem: function (key) {
            if (rcm.localStorage) {
                return sessionStorage.getItem(key);
            } else if (rcm.userDataStorage) {

                return rcm.userDataObj.getAttribute(key);
             }
        },

        storeData: function () {

            var formJSON = ValidationObject.getFormData(),
                formIDsString = ValidationObject.storageGetItem('formIDs'),
                formIDs;


            formIDs = (formIDsString == null) ? [] : formIDsString.split(',');
            if (formIDs.indexOf(rcm.formID) === -1) {
                formIDs.push(rcm.formID);
                ValidationObject.storageSetItem('formIDs', formIDs.join(','));
            }
            var jsonString = JSON.stringify(formJSON);
            ValidationObject.storageSetItem(rcm.formID, jsonString);
        },

        validateForm: function (e) {

            // e.preventDefault();

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

                //rcm.threeStrikesCount += 1;
                if (rcm.threeStrikesCount >= 3) {
                    formErrorMessage = (rcm.formErrorMessages[messageIdentifier + '__3strikes'] === null) ? formErrorMessage : rcm.formErrorMessages[messageIdentifier + '__3strikes'];
                }
                $(rcm.form).addClass('invalid');
                ValidationObject.displayMessageAndBlockSubmit(e, rcm.messageTemplate.replace('<p>[customMessage]</p>', '').replace('[errorMessages]', formErrorMessage));

                return;
            }


            // 3. store data client-side
            ValidationObject.storeData();

            // 4. anything else?
            ValidationObject.postProcessor(e);
        },

        getNextPage:  function(fraudTypes, currentPage) {
            if (['identify-partner'].indexOf(currentPage) !== -1 && fraudTypes.fraudTypeSelected('workEarning')) {
                return 'employment-prompt';
            } else if (['identify-partner','employment-suspect', 'employment-partner'].indexOf(currentPage) !== -1 && fraudTypes.fraudTypeSelected('disabilityCarers')) {
                return  '/rcm/disability-or-carers-benefit';
            } else if (['identify-partner','employment-suspect', 'employment-partner', 'disability-or-carers-benefit'].indexOf(currentPage) !== -1 && fraudTypes.fraudTypeSelected('livingAbroad')) {
                return  '/rcm/living-abroad';
            } else if (['identify-partner','employment-suspect', 'employment-partner', 'disability-or-carers-benefit', 'living-abroad'].indexOf(currentPage) !== -1 && fraudTypes.fraudTypeSelected('identityFraud')) {
                return  '/rcm/identity-fraud';
            } else if (['identify-partner','employment-suspect', 'employment-partner', 'disability-or-carers-benefit', 'living-abroad', 'identity-fraud'].indexOf(currentPage) !== -1 && fraudTypes.fraudTypeSelected('undeclaredIncome')) {
                return  '/rcm/undeclared-income';
            } else {
                return '/rcm/other-information';
            }
        },

        setupFormAction: function () {

            if (rcm.form.hasClass('js-routed')) {
                var fraudTypes = ValidationObject.storageGetItem('fraud-type').split('+');
                var currentPage = document.location.href.replace();
                currentPage = currentPage.substr(currentPage.lastIndexOf('/') + 1);
                currentPage = (currentPage.indexOf('#') === -1) ? currentPage : currentPage.substr(0, currentPage.indexOf('#'));

                var formAction = ValidationObject.getNextPage(fraudTypes, currentPage);
                console.log('currentPage = ' + currentPage);
                console.log('formAction = ' + formAction)
                $('form#' + rcm.formID).attr('action', formAction + '/');
            }
        },

        clearData: function () {

            var formIDsString = ValidationObject.storageGetItem('formIDs'),
                keys;


            // form__fraud-type,form__identify-partner,form__employment-prompt,form__employment-suspect,form__other-information,form__identify-suspect


            keys = (formIDsString == null) ? [] : formIDsString.split(',');
            keys.push('fraud-type');
            keys.push('employment');
            keys.push('formIDs');

            for (var k = 0, kl = keys.length; k < kl; k += 1) {
                ValidationObject.storageRemoveItem(keys[k]);
            }
            return false;
        }

    };

    var pageSetup = function () {
        $('a.previousPage.js-routed').on('click', function (e) {
            e.preventDefault();

            var myRoute = ValidationObject.storageGetItem('fraud-type');
            if (myRoute != null && myRoute != '') {
                var cpIndex, newPage,
                    employment = ValidationObject.storageGetItem('employment'),
                    routes = [],
                    currentPage = document.location.href.replace();

                routes['workEarning'] = ['other-information', 'employment-suspect', 'type-of-fraud'];
                routes['livingWithPartner'] = ['other-information', 'identify-partner'];
                routes['workEarning+livingWithPartner'] = [];
                routes['workEarning+livingWithPartner']['suspect'] = ['other-information', 'employment-suspect', 'employment-prompt', 'identify-partner'];
                routes['workEarning+livingWithPartner']['partner'] = ['other-information', 'employment-partner', 'employment-prompt', 'identify-partner'];
                routes['workEarning+livingWithPartner']['suspect+partner'] = ['other-information', 'employment-partner', 'employment-suspect-then-partner', 'employment-prompt', 'identify-partner'];
                routes['identityFraud'] = ['other-information', 'identity-fraud'];

                currentPage = currentPage.substr(currentPage.lastIndexOf('/') + 1);

                currentPage = (currentPage.indexOf('#') === -1) ? currentPage : currentPage.substr(0, currentPage.indexOf('#'));

                /*if (myRoute === 'workEarning+livingWithPartner') {
                    cpIndex = routes[myRoute][employment].indexOf(currentPage);
                    newPage = routes[myRoute][employment][cpIndex + 1];
                } else {
                  alert(myRoute);
                    cpIndex = routes[myRoute].indexOf(currentPage);
                    newPage = routes[myRoute][cpIndex + 1];
                }
                */
                alert(routesArr[0]);


                document.location.href = newPage;
            }
        });
    };

    function identifySuspect() {
      if($('#form__identify-suspect').length) {
        var formJSON = ValidationObject.getSavedFormData(null);
        var res = (formJSON['form__details']['details']);
        var resID;
        for (var i = 0; i < res.length; i++) {
          resID = (JSON.stringify(res[i])).replace(/\"/g, "");
          $('body').find('#' + resID).addClass('show');
        }
      }
    };

    $(document).ready(function () {
        pageSetup();
        ValidationObject.init();
        ValidationObject.setupFormAction();
        ValidationObject.getFormData(true);
        identifySuspect();


        var $blockLabels = $(".block-label input[type='radio'], .block-label input[type='checkbox']");
        new GOVUK.SelectionButtons($blockLabels);

    });


})();


/*




 */
