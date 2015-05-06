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
                messageTemplate :   '<div class="error-summary" role="group" tabindex="-1" aria-labelledby="error-summary-heading">' +
                '<h3 class="heading-medium error-summary-heading" id="error-summary-heading">' +
                'Unable to submit the form.' +
                '</h3>' +
                '<p>[customMessage]</p>' +
                '[errorMessages]' +
                '</div>'

            },

            init: function (formClassName) {
                rcm = this.settings;
                rcm.submitButton = 'form.' + formClassName + ' input[type="submit"]';
                this.disableHTML5validation(formClassName);
                this.bindUIActions();

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


            validateForm: function (e) {

                //e.preventDefault();

                ValidationObject.reset();

                // loop each validation-group
                $(rcm.form).find('.validation-group').removeClass('invalid valid').each(function () {
                    ValidationObject.validateGroup(this);
                });

                if (rcm.errorMessages !== '') {
                    e.preventDefault();
                    $(rcm.form).prepend(rcm.messageTemplate.replace('[customMessage]', 'Please check the following problem(s)').replace('[errorMessages]', '<ul class="list-bullet error-summary-list">' + rcm.errorMessages + '</ul>'));
                    $("html, body").animate({scrollTop:$('form').position().top - 20}, '500', 'swing');

                } else {
                    ValidationObject.validateFormSets(e);
                }

                ValidationObject.postProcessor(e);

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
                                            $(el).addClass('invalid').prev('label').prepend('<span class="error-message" aria-hidden="true">' + tooltip + '</span>');
                                        } else {
                                            $(el).addClass('invalid').parent().find('label').prepend('<span class="error-message" aria-hidden="true">' + tooltip + '</span>');
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

            validateGroup: function (el) {

                if ($(el).is(':visible')) {

                    rcm.validationMessage = $(el).attr('data-validation-message');

                    var fields, setOK, setsOK, sets,
                        validationType = $(el).attr('data-validation-type'),
                        typesToCheck = ['required--one-or-more', 'required--one', 'required--all', 'optional--one-or-more'],
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
                            if (fieldsWithValidValue.length > 0) {
                                $(el).addClass('valid');
                            }
                            break;
                        case 'required--one-or-more':
                        case 'required--one':
                            if (fieldsWithValidValue.length === 0) {
                                ValidationObject.invalidateElement(el);
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
                            }
                            break;
                        default:
                            // nothing
                            break;
                    }
                }
            },




            validateFormSets: function (e) {
                var groups, groupOK, setsOK, sets,
                    formValidationType,
                    formErrorMessage,
                    formErrorMessages = [];

                // move to external data file
                formErrorMessages['fraud-suspect'] = '<p>Please make sure you enter at least</p>' +
                '<ul class="list-bullet error-summary-list">' +
                '<li>A name, approximate age (or date of birth) and an address</li>' +
                '<li>A name, approximate age (or date of birth) and some additional info</li>' +
                '<li>A National insurance number and an approximate age (or date of birth)</li>' +
                '<li>A National insurance number and an address</li>' +
                '</ol>';
                formErrorMessages['fraud-suspect__3strikes'] = '<p>Having trouble? Call us on 0800 854 440.<br>' +
                'Otherwise please make sure you enter at least</p>' +
                '<ul class="list-bullet error-summary-list">' +
                '<li>A name, approximate age (or date of birth) and either an address or some additional info</li>' +
                '<li>A National insurance number and either an approximate age (or date of birth) or an address</li>' +
                '</ul>';


                // all the validate-groups have been checked - now check if the form requirements (sets) have been met

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
                                e.preventDefault();
                                var messageIdentifier = $(rcm.form).attr('data-form-validation-message').replace('$message--', '');
                                formErrorMessage = formErrorMessages[messageIdentifier];
                                rcm.threeStrikesCount += 1;
                                if (rcm.threeStrikesCount >= 3) {
                                    formErrorMessage = (formErrorMessages[messageIdentifier + '__3strikes'] === null) ? formErrorMessage : formErrorMessages[messageIdentifier + '__3strikes'];
                                }
                                //$(rcm.form).addClass('invalid').find('input[type="submit"]').before('<div class="validation-message">' + formErrorMessage + '</div>');
                                //$(rcm.form).addClass('invalid').before('<div class="validation-message">' + formErrorMessage + '</div>');
                                $(rcm.form).addClass('invalid').before(rcm.messageTemplate.replace('<p>[customMessage]</p>', '').replace('[errorMessages]', formErrorMessage));
                                $("html, body").animate({scrollTop:$('h1').position().top}, '500', 'swing');

                                return false;
                            }

                            break;
                    }
                }
            },

            postProcessor: function (e) {
                var redirectsSelected,
                    selected,
                    redirects = ['disabilityCarers', 'abroad', 'idFraud', 'savingsCapital'];

                switch ($(rcm.form).attr('id')) {
                    case 'form__fraud-type' : // redirect to new or old website based on user input

                        // reset the route cookie
                        docCookies.removeItem('fraud-type');

                        selected = $(rcm.form).find('input[type="checkbox"][name="fraud-type"]:checked').map(function () {
                            return this.value;
                        }).get();

                        redirectsSelected = $.grep(selected, function (n) {
                            return (redirects.indexOf(n) !== -1);
                        });
                        if (redirectsSelected.length > 0) {
                            e.preventDefault();
                            document.location.href = 'https://secure.dwp.gov.uk/benefitfraud/';
                        } else {
                            // store the choices in a cookie
                            docCookies.setItem('fraud-type', selected.join('+'));
                        }
                        break;

                }
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

            routes['workEarning'] = ['identify-suspect', 'employment-suspect', 'vehicle', 'other-information', 'complete'];
            routes['livingWithPartner'] = ['identify-suspect', 'identify-partner', 'vehicle', 'other-information', 'complete'];
            routes['workEarning+livingWithPartner'] = ['identify-suspect', 'identify-partner', 'employment-prompt','vehicle', 'other-information', 'complete'];

            currentPage = currentPage.substr(currentPage.lastIndexOf('/') + 1);
            currentPage = (currentPage.indexOf('#') === -1) ? currentPage : currentPage.substr(0, currentPage.indexOf('#'));

            cpIndex = routes[myRoute].indexOf(currentPage);
            newPage = routes[myRoute][cpIndex + 1];

            $('form.js-routed').each(function() {
                $(this).attr('action', newPage + '/');
            });


        }

    };

    $(document).ready(function () {
        pageSetup();
        ValidationObject.init('js-check');
    });


})();


/*




 */