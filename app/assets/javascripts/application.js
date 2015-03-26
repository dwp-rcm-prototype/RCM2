(function() {

    var formCheckValid = function(el) {
        var inputType = (el.tagName.toLowerCase() == 'textarea') ? 'textarea' : $(el).attr('type');


        switch (inputType) {
            case 'radio':
            case 'checkbox':
                return (el.checked) ? el.name : null;
                break;
            case 'text':
            case 'number':
            case 'textarea':
                return ($(el).val() != '') ? el.name : null;
                break;
            default:
                return null;
        }
    }
    var formCheckInvalid = function(el) {

        switch ($(el).attr('type')) {
            //case 'radio':
            case 'checkbox':
                return (!el.checked) ? el.name : null;
                break;
            case 'text':
                return ($(el).val() == '') ? el.name : null;
                break;
            default:
                return null;
        }
    }

    $(document).ready(function() {
        $('a.previousPage').each(function() {
            $(this).on('click', function() {
                if (!confirm('Are you sure you want to go back? You may lose form data.\n\nNB: We need to assess the need and functionality of this link')) {
                    return false;
                }
            });

        });


        /* display-none-js is a class that should only work to hide information when javascript is enabled */
        $('.display-none-js').hide();

        /* generic toggle functionality */
        $('.toggle-section').on('click', function() {
            var sections = $(this).parents('.form-group').attr('data-target');
            var sectionOn = $(this).parents('.form-group').attr('data-target') + '__' + $(this).val().toLowerCase();
            $('.' + sections).hide();
            $('.' + sectionOn).show();
        });




        $('form.crm-check').on('submit', function(e) {


//            e.preventDefault();
            var form = $(this),
                validationMessage = '',
                errorMessages = '',
                validationType = '',
                inputFields = ['input[type="text"]', 'input[type="number"]', 'input[type="checkbox"]', 'input[type="radio"]', 'select', 'textarea'],
                fieldsWithValidValue,
                fields;

            form.find('div.validation-message').remove();

            // loop each validation-group
            form.find('.validation-group:visible').each(function() {

                validationType = $(this).attr('data-validation-type');
                validationMessage = $(this).attr('data-validation-message');

                fieldsWithValidValue = $.unique($(this).removeClass('invalid').find(inputFields.join(',')).map(function() {
                    return formCheckValid(this);
                }).get());

                switch (validationType) {
                    case 'required--one-or-more':
                    case 'required--one':

                        if (fieldsWithValidValue.length == 0) {
                            $(this).addClass('invalid');
                            errorMessages += '<li id="validation-message-' + 0 + '">' + validationMessage + '</li>';
                        }
                        break;

                    case 'required--all':

                        fields = $.unique($(this).removeClass('invalid').find(inputFields.join(',')).map(function() {
                            return this.name;
                        }).get());

                        if (fields.length > fieldsWithValidValue.length) {
                            $(this).addClass('invalid');
                            errorMessages += '<li id="validation-message-' + 0 + '">' + validationMessage + '</li>';
                        }
                        break;
                }
            });

            if (errorMessages != '') {
                form.find('input[type="submit"]').before('<div class="validation-message"><ul class="list-bullet">' + errorMessages + '</ul></div>');
                return false;
            }

            // MANUAL OVERRIDES HERE
            if (form.attr('id') == 'form__fraud-type') { // redirect to new or old website based on user input
                var redirects = ['disabilityCarers', 'abroad', 'idFraud', 'savingsCapital'];
                var selected = form.find('input[type="checkbox"][name="fraud-type"]:checked').map(function() {
                    return this.value;
                }).get();
                var redirectsSelected = $.grep(selected, function(n) {
                    return ( redirects.indexOf(n) != -1 );
                });
                if (redirectsSelected.length > 0) {
                    e.preventDefault();
                    document.location.href = 'https://secure.dwp.gov.uk/benefitfraud/';
                }
            }

        });
    });

})();



    /*

    $('form.crm-check-form').on('submit', function(e) {



        var form = $(this), errorMessage = '';


        // check (groups of) checkboxes where (at least) one must be checked
        var ids = $.unique(form.find('.fieldset').removeClass('invalid').find('input[type="checkbox"].required--one-or-more').map(function() {
            return this.name;
        }).get());
        if (ids.length > 0) {
            var idsChecked = $.unique(form.find('input[type="checkbox"].required--one-or-more:checked').map(function () {
                return (this.name);
            }).get());

            if (idsChecked.length < ids.length) { // not all groups of checkboxes have at least one checked
                // report the issue. Filter out the checked IDs
                ids = $.grep(ids, function (n) {
                    return ( idsChecked.indexOf(n) == -1 );
                });


                for (var i = 0, il = ids.length; i < il; i++) {
                    form.find('#fieldset--' + ids[i]).each(function () {
                        $(this).addClass('invalid');
                        errorMessage += '<li>' + $(this).attr('data-error-message') + '</li>';

                    });
                };
            }
        }

        // check required radio buttons

        var ids = $.unique(form.find('.fieldset').find('input[type="radio"].required').map(function() {
            return this.name.replace('helper--', '');
        }).get());
        if (ids.length > 0) {
            var idsChecked = $.unique(form.find('input[type="radio"].required:checked').map(function () {
                return this.name.replace('helper--', '');
            }).get());

            if (idsChecked.length < ids.length) { // not all required sets of radio buttons have been ticked
                // report the issue. Filter out the checked IDs
                ids = $.grep(ids, function (n) {
                    return (idsChecked.indexOf(n) == -1);
                });

                for (var i = 0, il = ids.length; i < il; i++) {
                    form.find('#fieldset--' + ids[i]).each(function() {
                        // set the invalid class and add functionality to remove it
                        $(this).addClass('invalid').attr('data-error-id', i).find('input[type="radio"]').each(function() {

                            $(this).on('click', function () {
                                var errorID = $(this).parents('.invalid').removeClass('invalid').attr('data-error-id');
                                $('#error__' + errorID).remove();
                                if (form.find('div.validation-message').find('li').length == 0) {
                                    form.find('div.validation-message').remove();
                                }
                            });
                        });
                        errorMessage += '<li id="error__' + i + '">' + $(this).attr('data-error-message') + '</li>';
                    });
                };
            }
        }


        // check required text fields
        var parentNames = [];

        var ids = $.unique(form.find('.fieldset').removeClass('invalid').find('input[type="text"].required:visible, input[type="number"].required:visible').map(function() {
            return this.name.replace('helper--', '');
        }).get());
        console.log(ids);
        if (ids.length > 0) {
            var idsValid = $.unique(form.find('input[type="text"].required:visible, input[type="number"].required:visible').map(function () {
                // TODO: add validation based on regexp
                if ($(this).val() == '') {
                    parentNames.push($(this).attr('data-parent-fieldset'));
                    return null
                } else {
                    return this.name.replace('helper--', '');
                }

            }).get());
console.log(idsValid);
            if (idsValid.length < ids.length) { // not all required sets of radio buttons have been ticked
                // report the issue. Filter out the valid IDs
                ids = $.grep(ids, function (n) {
                    return (idsValid.indexOf(n) == -1);
                });

                console.log(ids);

                for (var i = 0, il = ids.length; i < il; i++) {
                    console.log('invalidating #fieldset--' + ids[i]);
                    form.find('#fieldset--' + ids[i]).each(function () {
                        $(this).addClass('invalid');
                        errorMessage += '<li>' + $(this).attr('data-error-message') + '</li>';
                    });
                };
                for (var i = 0, il = parentNames.length; i < il; i++) {
                    console.log('invalidating #fieldset--' + parentNames[i]);
                    form.find('#fieldset--' + parentNames[i]).each(function () {
                        $(this).addClass('invalid');
                        errorMessage += '<li>' + $(this).attr('data-error-message') + '</li>';
                    });
                };

            }
            console.log('------');
        }



        if (errorMessage != '') {
            form.find('div.validation-message').remove();
            form.find('input[type="submit"]').before('<div class="validation-message"><ul class="list-bullet">' + errorMessage + '</ul></div>');

            return false
        }

return false;


    });
    */
