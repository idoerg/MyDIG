def getMultiDict(post, name):
    dic = []
    for k in post.keys():
        if k.startswith(name):
            rest = k[len(name):]

            # split the string into different components
            parts = [p[:-1] for p in rest.split('[')][1:]
            print parts
            listId = int(parts[0])

            # add a new dictionary if it doesn't exist yet
            if listId not in dic:
                dic[listId] = {}

            # add the information to the dictionary
            dic[listId][parts[1]] = post.get(k)
    return dic