function tabStopFilter()
  return {
    Para = function (elem)
      -- Check if the paragraph contains a tab_stop metadata field
      if elem.meta and elem.meta.tab_stop then
        local tabStop = elem.meta.tab_stop
        if type(tabStop) == "number" then
          -- Set the tab_stop value to 5
          elem.attributes = { ['tab-stop'] = tostring(tabStop) }
        end
      end
      return elem
    end
  }
end

function Pandoc(doc)


  -- Apply the tabStopFilter
  return pandoc.Pandoc(doc.blocks, doc.meta):filter(tabStopFilter())
end

return {
  {
    Pandoc = function(doc)
      return Pandoc(doc)
    end
  }
}
