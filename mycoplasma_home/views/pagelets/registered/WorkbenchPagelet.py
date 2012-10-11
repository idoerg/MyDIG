'''
    Pagelet for the user Workbench
    
    Author: Andrew Oberlin
    Date: July 23, 2012
'''
from renderEngine.PageletBase import PageletBase
from multiuploader.models import Image
from mycoplasma_home.models import Picture

class WorkbenchPagelet(PageletBase):
    '''
        Renders the user workbench for the website        
    
        Params: request -- the Django request object with the POST & GET args
        
        Returns: Dictionary of arguments for rendering this pagelet
    '''
    def doProcessRender(self, request):
        self.setLayout('registered/workbench.html')

        privateImages = Image.objects.filter(user__exact=request.user.pk)
        publicImages = Picture.objects.filter(originalUser__exact=request.user.pk)

        myImages = []
        
        # private 
        for image in privateImages:
            myImages.append({
                'permissions' : 'private',
                'image' : image
            })
        
        #
        for image in publicImages:
            myImages.append({
                'permissions' : 'public',
                'image' : image
            })
        
        return {
            'myImages' : myImages
        }
