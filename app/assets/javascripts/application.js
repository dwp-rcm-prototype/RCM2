(function () {
    "use strict";

    if (!Array.prototype.indexOf) {
        Array.prototype.indexOf = function(obj, start) {
            for (var i = (start || 0), j = this.length; i < j; i++) {
                if (this[i] === obj) { return i; }
            }
            return -1;
        }
    };

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
            threeStrikesCount: 0
        },

        init: function (formClassName) {
            rcm = this.settings;
            rcm.submitButton = 'form.' + formClassName + ' input[type="submit"]';
            this.disableHTML5validation(formClassName);
            this.bindUIActions();
        },

        reset: function () {
            rcm.errorCount = 0;
            rcm.errorMessages = '';
            $(rcm.form).removeClass('invalid').find('div.validation-message').remove();
            // remove all valids and invalids?
        },

        bindUIActions: function () {
            $(rcm.submitButton).on("click", function (e) {
                //e.preventDefault();
                rcm.form = $(this).parents('form');
                ValidationObject.validateForm(e);
            });

            // display-none-js is a class that should only work to hide information when javascript is enabled
            $('.display-none-js').hide();

            // generic toggle functionality
            $('.toggle-section').on('click', function () {
                var sections = $(this).parents('.form-group').attr('data-target'),
                    sectionOn = $(this).parents('.form-group').attr('data-target') + '__' + $(this).val().toLowerCase();
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
                $(rcm.form).find('input[type="submit"]').before('<div class="validation-message"><ul class="list-bullet">' + rcm.errorMessages + '</ul></div>');
            } else {
                ValidationObject.validateFormSets(e);
            }

            ValidationObject.exceptions(e);

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

                    if ($(el).next('p.sticky').get(0) != null) {
                        defaultTooltip = $(el).next('p.sticky').attr('data-default-text')
                        $(el).removeClass('invalid').next('p.sticky').html(defaultTooltip);
                    } else {
                        $(el).removeClass('invalid').next('p.form-hint.display-block').remove();
                    }
                    regexObj = new RegExp(pattern, "gi");
                    result = regexObj.test(value);
                    if (result) {
                        return el.name;
                    } else {
                        if ($(el).val() !== '') {
                            $(el).addClass('invalid');

                            tooltip = $(el).attr('data-field-error');
console.log(tooltip);
console.log($(el).next('p.sticky').get(0));
                            if (tooltip != null) {
                                if ($(el).next('p.sticky').get(0) != null) {
                                    $(el).next('p.sticky').html(tooltip);
                                } else {
                                    console.log('in here');
                                    $(el).after('<p class="form-hint display-block">' + tooltip + '</p>');
                                }
                            }
                        }
                        return null;
                    }
                }
            default:
                return null;

            }
        },

        invalidateElement: function (el) {
            if (el.tagName.toUpperCase() === 'INPUT') {
                $(el).addClass('invalid');
                //.on('click focusout', function () {
                //        if (ValidationObject.fieldValid(el) != null) {
                //            $(el).removeClass('invalid');
                //        }
                //    });
            } else {
                $(el).addClass('invalid');
                //.find('input').each(function () {
                //        $(this).on('click focusout', function () {
                //            if (fieldValid(this) != null) {
                //                $(this).removeClass('invalid');//.parents('.validation-group.invalid');
                //            }
                //        });
                //    });
            }
            rcm.errorMessages += '<li id="validation-message-' + rcm.errorCount + '">' + rcm.validationMessage + '</li>';
            rcm.errorCount += 1;
        },

        validateGroup: function (el) {

            if ($(el).is(':visible')) {

                rcm.validationMessage = $(el).attr('data-validation-message');

                var fields, setOK, setsOK, sets,
                    validationType = $(el).attr('data-validation-type'),
                    typesToCheck = ['required--one-or-more', 'required--one', 'required--all', 'not-required--one-or-more', 'not-required--one'],
                    fieldsWithValidValue = [],
                    allFields = [];


                if (typesToCheck.indexOf(validationType) !== -1) {

                    fieldsWithValidValue = $.unique($(el).find(rcm.inputFields.join(',')).map(function () {
                        return ValidationObject.fieldValid(this);
                    }).get());
                }

                switch (validationType) {
                // it's not required, so don't display error messages. But when there is valid data, mark it as such
                case 'not-required--one-or-more':
                case 'not-required--one':
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
                    sets = $(el).attr('data-validation-set').split('|');

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
            formErrorMessages['fraud-suspect'] = 'Please make sure you enter at least<ol class="list-bullet">' +
                '<li>A name, approximate age (or date of birth) and an address</li>' +
                '<li>A name, approximate age (or date of birth) and some additional info</li>' +
                '<li>A National insurance number and an approximate age (or date of birth)</li>' +
                '<li>A National insurance number and an address</li>' +
                '</ul>';
            formErrorMessages['fraud-suspect__3strikes'] = 'Having trouble? Call us on 0800 854 440.<br><br>Otherwise please make sure you enter at least<ol class="list-bullet">' +
                '<li>A name, approximate age (or date of birth) and either an address or some additional info</li>' +
                '<li>A National insurance number and either an approximate age (or date of birth) or an address</li>' +
                '</ul>';


            // all the validate-groups have been checked - now check if the form requirements (sets) have been met

            formValidationType = $(rcm.form).attr('data-form-validation-type');
            if (formValidationType !== null) {
                switch (formValidationType) {
                case 'required--set':
                    setsOK = false;
                    sets = $(rcm.form).attr('data-form-validation-set').split('|');

                    for (var s = 0, sl = sets.length; s < sl; s += 1) {
                        groups = sets[s].split(',');
                        groupOK = true;

                        for (var f = 0, fl = groups.length; f < fl; f += 1) {
                            if (!$('[data-validation-id="' + groups[f] + '"]').hasClass('valid')) {
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
                        $(rcm.form).addClass('invalid').find('input[type="submit"]').before('<div class="validation-message">' + formErrorMessage + '</div>');

                        return false;
                    }

                    break;
                }
            }
        },

        exceptions: function (e) {
            var redirectsSelected,
                selected,
                redirects = ['disabilityCarers', 'abroad', 'idFraud', 'savingsCapital'];

            if ($(rcm.form).attr('id') === 'form__fraud-type') { // redirect to new or old website based on user input

                selected = $(rcm.form).find('input[type="checkbox"][name="fraud-type"]:checked').map(function () {
                    return this.value;
                }).get();

                redirectsSelected = $.grep(selected, function (n) {
                    return (redirects.indexOf(n) !== -1);
                });
                if (redirectsSelected.length > 0) {
                    e.preventDefault();
                    document.location.href = 'https://secure.dwp.gov.uk/benefitfraud/';
                }
            }
        }

    };

    var pageSetup = function () {

        $('a.previousPage').each(function () {
            $(this).on('click', function () {
                if (!confirm('Are you sure you want to go back? You may lose form data.\n\nNB: We need to assess the need and functionality of this link')) {
                    return false;
                }
            });
        });
    };

    $(document).ready(function () {
        pageSetup();
        ValidationObject.init('rcm-check');
    });


})();
