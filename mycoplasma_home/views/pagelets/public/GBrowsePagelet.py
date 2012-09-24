'''
	Pagelet for the GBrowse Visualization
	
	Author: Andrew Oberlin
	Date: August 14, 2012
'''
from renderEngine.PageletBase import PageletBase

class GBrowsePagelet(PageletBase):
	'''
		Renders the center of the home page		
	
		Params: request -- the Django request object with the POST & GET args
		
		Returns: Dictionary of arguments for rendering this pagelet
	'''
	def doProcessRender(self, request):
		self.setLayout('public/gbrowse.html')
		return {}
