# Adding documentation

Documentation lives under a repository 
so it has all the benefits of having a clear owner, versioning, reviewing and 
ability to create issues to provide feedback.

Documentation has to be in [markdown](https://www.markdownguide.org/basic-syntax/)
and structure of the documentation is specified using [mkdocs](https://www.mkdocs.org/).

## Repository structure

1. Create a `docs` folder under your repo.
2. Move all your documentation to this folder
   - Even README.md, its fine, github will be able to find it under `docs` folder.
3. Create a `mkdocs.yml` file at the root of your repo that describes
   documentation inside you `docs` folder.

## Catalog changes

1. Add `backstage.io/techdocs-ref: dir:.` field under `metadata.annotations`.
2. Add `github.com/project-slug` field under `metadata.annotations` 
   with the name of the repo preceded by fork name. 

This is how metadata should look like:
```
metadata:
  name: my-repo-service
  description: Backstage My repository example service
  annotations:
    backstage.io/techdocs-ref: dir:.
    github.com/project-slug: riskive/my-repo
```

## Expected result

1. You should see a new entry under documentation section.
2. Documentation should be searchable (this takes some minutes to be indexed)
3. When opening documentation you should be able to see index on the side
   which matches what is described un your `mkdocs.yml`

## Troubleshooting

* **When accessing documentation on backstage it fails to generate it:**
  - Make sure that your `mkdocs.yml` exist in the root of your repo.
  - Make sure paths described `mkdocs.yml` are relative to
    files under `docs` folder.
