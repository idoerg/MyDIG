'''
    Pagelet for the Image Editor which is both an admin
    and a public application

    Author: Andrew Oberlin
    Date: August 5, 2012
'''
from renderEngine.PageletBase import PageletBase
from mycoplasma_home.views.api import ImagesAPI
import simplejson as json
from mycoplasma_home.models import RecentlyViewedPicture, Picture

from django.core.exceptions import ObjectDoesNotExist

class ImageEditorPagelet(PageletBase):
    '''
        Renders the center of the home page        
    
        Params: request -- the Django request object with the POST & GET args
        
        Returns: Dictionary of arguments for rendering this pagelet
    '''
    def doProcessRender(self, request):
        self.setLayout('public/imageEditor.html')
        try:
            imageKey = request.REQUEST['imageKey']
            image = Picture.objects.get(pk__exact=imageKey)
            if (not image.isPrivate):
                tagGroups = ImagesAPI.getImageTagGroups(image, user=request.user, getTags=True, getLinks=True, isKey=False)
                imageMetadata = ImagesAPI.getImageMetadata(image, user=request.user, isKey=False)
        
                return {
                    'imageMetadata' : json.dumps(imageMetadata),
                    'tagGroups' : json.dumps(tagGroups),
                    'image' : image
                }
            else:
                self.setLayout('public/404Media.html')
                return {}
        except ObjectDoesNotExist:
            self.setLayout('public/404Media.html')
            return {}
        except KeyError:
            self.setLayout('public/404Media.html')
            return {}