$(document).ready(function() {
    $('a.previousPage').each(function() {
        $(this).on('click', function() {
            if (!confirm('Are you sure you want to go back? You may lose form data./n/nNB: We need to assess the need and functionality of this link')) {
                return false;
            }
        });

    });

    $('form.crm-check-form').on('submit', function() {

        // check (groups of) checkboxes where (at least) one must be checked

        var form = $(this);

        var ids = $.unique(form.find('fieldset').removeClass('invalid').find('input[type="checkbox"].required--one-or-more').map(function() {
            return this.name;
        }).get());
        var idsChecked = $.unique(form.find('input[type="checkbox"].required--one-or-more:checked').map(function() {
            return (this.name);
        }).get());

        if (idsChecked.length < ids.length) { // not all groups of checkboxes have at least one checked
            // report the issue. Filter out the checked IDs
            ids = $.grep(ids, function(n) {
                return ( idsChecked.indexOf(n) == -1 );
            });

            var errorMessage = '';

            for (var i = 0, il = ids.length; i < il; i ++) {
                form.find('#fieldset-' + ids[i] ).each(function() {
                    $(this).addClass('invalid');
                    errorMessage += '<li>' + $(this).attr('data-error-message') + '</li>';

                });
            };

            form.find('div.validation-message').remove();
            form.find('input[type="submit"]').before('<div class="validation-message">' + errorMessage + '</div>');

            return false
        }
    });
});