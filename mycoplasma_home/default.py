from django.db import models

# Create your models here.

class NavBarOption(models.Model):
    optionName = models.CharField(max_length=20)
    href = models.CharField(max_length=100)
    rank = models.IntegerField()
    def __unicode__(self):
        return self.optionName

class DropDownItem(models.Model):
    itemName = models.CharField(max_length=20)
    navBarOpt = models.ForeignKey(NavBarOption)
    href = models.CharField(max_length=100, unique=False)
    rank = models.IntegerField()
    def __unicode__(self):
        return self.itemName

class Pictures(models.Model):
    description = models.TextField()
    imageName = models.ImageField(upload_to="pictures/")
    publication = models.CharField(max_length=50)
    altText = models.TextField()
    def __unicode__(self):
        return self.altText

class PictureTypes(models.Model):
    description = models.CharField(max_length=50)
    imageType = models.CharField(max_length=15)
    def __unicode__(self):
        return self.imageType

class PictureProps(models.Model):
    picture_id = models.ForeignKey(Pictures)
    type_id = models.ForeignKey(PictureTypes)
    def __unicode__(self):
        return ", ".join((str(self.picture_id), str(self.type_id)))
    class Meta:
        unique_together = ('picture_id','type_id')

class PictureDefinitionTag(models.Model):
    picture = models.ForeignKey(Pictures)
    organism_id = models.IntegerField()
    name = models.TextField()
    def __unicode__(self):
        return ", ".join((str(self.picture_id), str(self.name)))

class TagColor(models.Model):
    red = models.IntegerField()
    green = models.IntegerField()
    blue = models.IntegerField()
    def __unicode__(self):
        return 'R: ' + str(self.red) + ', G: ' + str(self.green) + ', B: ' + str(self.blue)

class TagGroup(models.Model):
    description = models.CharField(max_length=50)
    color = models.ForeignKey(TagColor)
    picture = models.ForeignKey(Pictures)
    def __unicode__(self):
        return self.description
    
class TagPoint(models.Model):
    group = models.ForeignKey(TagGroup)
    pointX = models.IntegerField()
    pointY = models.IntegerField()
    rank = models.IntegerField()
    def __unicode__(self):
        return "(" + str(self.pointX) + "," + str(self.pointY) + ") " + self.group.description
        
class BlastUpload(models.Model):
    fasta_file = models.FileField(upload_to="fasta_files/")
    name = models.TextField()
    def __unicode__(self):
        return self.name

class GenomeUpload(models.Model):
    genbank_file = models.FileField(upload_to="genbank_files/")
    name = models.TextField()
    def __unicode__(self):
        return self.name
        
class Landmark(models.Model):
    name = models.CharField(max_length=10)
    organism_id = models.IntegerField()
    def __unicode__(self):
        return self.name
