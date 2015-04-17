window.addEventListener('DOMContentLoaded', function() {

    var mover = document.querySelector('.slides_move');

    Array.forEach( document.querySelectorAll('.header button'), function(button)
    {
        button.addEventListener('click', function()
        {
            var slide_class = this.getAttribute('data-slide')+'_visible';
            if(!mover.classList.contains(slide_class))
            {
                mover.className='slides_move '+slide_class;
            }
            else
            {
                mover.className='slides_move center_visible';
            }
        });
    });

});
